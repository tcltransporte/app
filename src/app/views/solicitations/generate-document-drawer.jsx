'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Collapse,
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Edit as EditIcon } from '@mui/icons-material';
import { DocumentDetail } from '../documents/document-detail';
import { SelectField } from '@/components/controls/SelectField';
import * as documentTypeService from '@/app/services/documentType.service';
import * as solicitationService from '@/app/services/solicitation.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

/**
 * rowItems[solicitationId] = Array<{ rowKey: string, checked: boolean, documentTypeId: number }>
 */

function SolicitationRow({ solicitation, documentTypes, rows, onToggle, onChangeType, onEdit }) {
  const [expanded, setExpanded] = React.useState(true);
  const solRows = rows[solicitation.id] || [];

  return (
    <>
      <TableRow sx={{ backgroundColor: 'action.hover' }}>
        <TableCell colSpan={3} sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setExpanded(prev => !prev)}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Typography variant="body2" fontWeight={600}>
              #{solicitation.number} — {solicitation.partner?.surname || solicitation.partner?.name || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {solicitation.description || ''}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Tipo de Documento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solRows.map((row) => (
                  <TableRow key={row.rowKey} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={row.checked}
                        onChange={() => onToggle(solicitation.id, row.rowKey)}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <SelectField
                          value={row.documentTypeId || ''}
                          onChange={(val) => onChangeType(solicitation.id, row.rowKey, val)}
                          disabled={!row.checked}
                          options={documentTypes.map(dt => ({ value: dt.id, label: dt.description }))}
                          variant="outlined"
                        />
                        <IconButton size="small" onClick={() => onEdit(solicitation.id, row.rowKey)} disabled={!row.checked}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {solRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="caption" color="text.secondary">Nenhum documento configurado.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function GenerateDocumentDrawer({ open, solicitations = [], onClose, onSave }) {
  const [documentTypes, setDocumentTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // rows: { [solicitationId]: Array<{ rowKey, checked, documentTypeId }> }
  const [rows, setRows] = React.useState({});

  const [editModal, setEditModal] = React.useState({ open: false, rowKey: null, solicitationId: null, initialData: null });

  React.useEffect(() => {
    if (!open || solicitations.length === 0) return;
    setLoading(true);
    setRows({});

    Promise.all([
      documentTypeService.findAll(),
      solicitationService.generateDocuments(solicitations.map(s => s.id))
    ]).then(([typesResult, docsResult]) => {
      if (typesResult.status === ServiceStatus.SUCCESS) {
        setDocumentTypes(typesResult.items || []);
      }

      if (docsResult.status === ServiceStatus.SUCCESS) {
        const initial = {};
        const hydratedSolicitations = docsResult.items || [];

        hydratedSolicitations.forEach(s => {
          const autoRows = [];
          const defaultInvoiceDate = new Date().toISOString().split('T')[0];

          if (s.documents && s.documents.length > 0) {
            s.documents.forEach((doc, idx) => {
              autoRows.push({
                rowKey: doc.id ? `existing-${doc.id}` : `new-${s.id}-${idx}`,
                checked: true,
                documentTypeId: doc.documentModelId || doc.documentTypeId,
                invoiceNumber: doc.invoiceNumber || 0,
                invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate).toISOString().split('T')[0] : defaultInvoiceDate,
                invoiceValue: doc.invoiceValue || 0,
                id: doc.id
              });
            });
          }
          initial[s.id] = autoRows;
        });

        // Merge with existing array (just in case)
        solicitations.forEach(s => {
          if (!initial[s.id]) initial[s.id] = [];
        });

        setRows(initial);
      }
    }).finally(() => setLoading(false));
  }, [open, solicitations]);

  const handleToggle = (solicitationId, rowKey) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: prev[solicitationId].map(r =>
        r.rowKey === rowKey ? { ...r, checked: !r.checked } : r
      ),
    }));
  };

  const handleChangeType = (solicitationId, rowKey, documentTypeId) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: prev[solicitationId].map(r =>
        r.rowKey === rowKey ? { ...r, documentTypeId } : r
      ),
    }));
  };

  const handleEdit = (solicitationId, rowKey) => {
    const solRows = rows[solicitationId] || [];
    const row = solRows.find(r => r.rowKey === rowKey);
    if (row) {
      const formattedDate = row.invoiceDate ? new Date(row.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setEditModal({
        open: true,
        solicitationId,
        rowKey,
        initialData: {
          documentTypeId: row.documentTypeId || '',
          invoiceNumber: row.invoiceNumber || 0,
          invoiceDate: formattedDate,
          invoiceValue: row.invoiceValue || 0,
        }
      });
    }
  };

  const handleSaveEdit = (editedForm) => {
    if (!editModal.solicitationId) return;
    setRows(prev => ({
      ...prev,
      [editModal.solicitationId]: prev[editModal.solicitationId].map(r =>
        r.rowKey === editModal.rowKey ? {
          ...r,
          documentTypeId: editedForm.documentTypeId,
          invoiceNumber: Number(editedForm.invoiceNumber),
          invoiceDate: editedForm.invoiceDate,
          invoiceValue: Number(editedForm.invoiceValue)
        } : r
      ),
    }));
    setEditModal({ open: false, rowKey: null, solicitationId: null, initialData: null });
  };

  const hasAnySelected = Object.values(rows).some(solRows => solRows.some(r => r.checked));

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      for (const solicitation of solicitations) {
        const solRows = rows[solicitation.id] || [];
        const docs = solRows
          .filter(r => r.checked && r.documentTypeId)
          .map(r => ({
            id: r.id,
            documentModelId: r.documentTypeId,
            invoiceNumber: r.invoiceNumber || 0,
            invoiceDate: r.invoiceDate ? new Date(r.invoiceDate) : new Date(),
            invoiceValue: r.invoiceValue || 0
          }));

        if (docs.length === 0) continue;

        const result = await solicitationService.saveDocuments(
          solicitation.id,
          docs
        );

        if (result.status !== ServiceStatus.SUCCESS)
          throw new Error(result.message || 'Erro ao gerar documento.');
      }
      alert.success('Documentos gerados com sucesso!');
      onSave?.();
      onClose();
    } catch (error) {
      alert.error('Erro ao gerar documentos', error?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Typography variant="h6" fontWeight={600}>Gerar documentos</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Divider />

      {/* Body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Table size="small">
            <TableBody>
              {solicitations.map(s => (
                <SolicitationRow
                  key={s.id}
                  solicitation={s}
                  documentTypes={documentTypes}
                  rows={rows}
                  onToggle={handleToggle}
                  onChangeType={handleChangeType}
                  onEdit={handleEdit}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={submitting}
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={loading || submitting || !hasAnySelected}
          onClick={handleConfirm}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {submitting ? 'Gerando...' : 'Confirmar'}
        </Button>
      </Box>

      {/* Edit Modal */}
      <DocumentDetail
        open={editModal.open}
        onClose={() => setEditModal({ open: false, rowKey: null, solicitationId: null, initialData: null })}
        onSave={handleSaveEdit}
        documentTypes={documentTypes}
        initialData={editModal.initialData}
      />

    </Drawer>
  );
}
