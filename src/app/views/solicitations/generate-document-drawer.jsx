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
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DocumentDetail } from '../documents/document-detail';
import { SelectField, NumericField } from '@/components/controls';
// No longer using AutoComplete here as we have manual filters in modal
import * as documentTypeService from '@/app/services/documentType.service';
import * as solicitationService from '@/app/services/solicitation.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

/**
 * rowItems[solicitationId] = Array<{ rowKey: string, checked: boolean, documentTypeId: number }>
 */

function SolicitationRow({ solicitation, documentTypes, rows, onToggle, onChangeType, onChangeValue, onEdit, onLinkClick, onUnlink }) {
  const [expanded, setExpanded] = React.useState(true);
  const [unlinkMenu, setUnlinkMenu] = React.useState({ anchorEl: null, rowKey: null });

  const handleUnlinkOpen = (event, rowKey) => {
    setUnlinkMenu({ anchorEl: event.currentTarget, rowKey });
  };

  const handleUnlinkClose = () => {
    setUnlinkMenu({ anchorEl: null, rowKey: null });
  };

  const handleUnlinkClick = () => {
    onUnlink(solicitation.id, unlinkMenu.rowKey);
    handleUnlinkClose();
  };

  const solRows = rows[solicitation.id] || [];
  const totalDocuments = solRows.filter(r => r.checked).reduce((sum, r) => sum + (Number(r.invoiceValue) || 0), 0);
  const totalPayments = (solicitation.payments || []).reduce((sum, p) => sum + (Number(p.value) || 0), 0);

  const isDivergent = Math.abs(totalDocuments - totalPayments) > 0.01;

  return (
    <>
      <TableRow sx={{ backgroundColor: 'action.hover' }}>
        <TableCell colSpan={2} sx={{ py: 1 }}>
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
        <TableCell align="right" sx={{ py: 1, pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            {isDivergent && (
              <Tooltip title={`Divergência: Documentos (R$ ${totalDocuments.toFixed(2)}) ≠ Pagamentos (R$ ${totalPayments.toFixed(2)})`}>
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
            <Typography variant="body2" fontWeight={700} color="primary">
              R$ {totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {solRows.some(r => r.id) ? (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 1, m: 1 }}>
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  Os documentos para esta solicitação já foram gerados.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Utilize a visualização detalhada na tabela para editar ou visualizar.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 80 }}>Ações</TableCell>
                    <TableCell>Tipo / Modelo</TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>Valor (R$)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solRows.map((row) => (
                    <TableRow key={row.rowKey} hover>
                      <TableCell sx={{ width: 80 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => onEdit(solicitation.id, row.rowKey)} disabled={!row.checked}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {row.id ? (
                            <Tooltip title="Vínculo realizado. Clique para opções.">
                              <IconButton size="small" color="success" onClick={(e) => handleUnlinkOpen(e, row.rowKey)} disabled={!row.checked}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Vincular documento existente">
                              <IconButton size="small" onClick={(e) => onLinkClick(e, solicitation.id, row.rowKey)} disabled={!row.checked}>
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        <Menu
                          anchorEl={unlinkMenu.anchorEl}
                          open={Boolean(unlinkMenu.anchorEl)}
                          onClose={handleUnlinkClose}
                        >
                          <MenuItem onClick={handleUnlinkClick} sx={{ color: 'error.main' }}>
                            Desvincular documento
                          </MenuItem>
                        </Menu>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <SelectField
                          label="Tipo"
                          value={row.documentTypeId || ''}
                          onChange={(val) => onChangeType(solicitation.id, row.rowKey, val)}
                          disabled={!row.checked}
                          options={documentTypes.map(dt => ({ value: dt.id, label: dt.surname }))}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 140 }}>
                        <NumericField
                          label="Valor"
                          value={row.invoiceValue || 0}
                          onChange={(val) => onChangeValue(solicitation.id, row.rowKey, val)}
                          disabled={!row.checked}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {solRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="caption" color="text.secondary">Nenhum documento configurado.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function LinkDocumentModal({ open, onClose, onSelect }) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/search/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search })
      });
      const data = await resp.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, pr: 6 }}>
        Vincular Documento Existente
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, mb: 3, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Pesquisar por número da NF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="contained" onClick={handleSearch} disabled={loading} startIcon={<SearchIcon />}>
            Buscar
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>NF</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((doc) => (
              <TableRow
                key={doc.id}
                hover
                sx={{
                  '& .link-button': { opacity: 0, transition: '0.2s' },
                  '&:hover .link-button': { opacity: 1 }
                }}
              >
                <TableCell>{doc.id}</TableCell>
                <TableCell>{doc.invoiceNumber}</TableCell>
                <TableCell>{new Date(doc.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>R$ {doc.invoiceValue}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Vincular este documento">
                    <IconButton
                      className="link-button"
                      size="large"
                      color="success"
                      onClick={() => onSelect(doc)}
                      sx={{
                        backgroundColor: 'success.lighter',
                        '&:hover': { backgroundColor: 'success.light' }
                      }}
                    >
                      <CheckCircleIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {results.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Nenhum documento encontrado.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export function GenerateDocumentDrawer({ open, solicitations = [], onClose, onSave }) {
  const [documentTypes, setDocumentTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // rows: { [solicitationId]: Array<{ rowKey, checked, documentTypeId }> }
  const [rows, setRows] = React.useState({});

  const [editModal, setEditModal] = React.useState({ open: false, rowKey: null, solicitationId: null, initialData: null });
  const [linkModal, setLinkModal] = React.useState({ open: false, solicitationId: null, rowKey: null });

  React.useEffect(() => {
    if (!open || solicitations.length === 0) return;
    setLoading(true);
    setRows({});

    Promise.all([
      documentTypeService.findAll(),
      solicitationService.generateDocuments(solicitations.map(s => s.id))
    ]).then(([typesResult, docsResult]) => {
      if (typesResult.header.status === ServiceStatus.SUCCESS) {
        setDocumentTypes(typesResult.body.items || []);
      }

      if (docsResult.header.status === ServiceStatus.SUCCESS) {
        const initial = {};
        const hydratedSolicitations = docsResult.body.items || [];

        hydratedSolicitations.forEach(s => {
          const autoRows = [];
          const defaultInvoiceDate = new Date().toISOString().split('T')[0];

          if (s.documents && s.documents.length > 0) {
            s.documents.forEach((doc, idx) => {
              autoRows.push({
                rowKey: doc.id ? `existing-${doc.id}` : `new-${s.id}-${idx}`,
                checked: true,
                documentTypeId: doc.documentTypeId,
                invoiceNumber: doc.invoiceNumber || 0,
                invoiceSeries: doc.invoiceSeries || '',
                invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate).toISOString().split('T')[0] : defaultInvoiceDate,
                receiptDate: doc.receiptDate ? new Date(doc.receiptDate).toISOString().split('T')[0] : '',
                invoiceKey: doc.invoiceKey || '',
                invoiceValue: doc.invoiceValue || 0,
                totalProductsValue: doc.totalProductsValue || 0,
                discountValue: doc.discountValue || 0,
                freightValue: doc.freightValue || 0,
                insuranceValue: doc.insuranceValue || 0,
                otherValues: doc.otherValues || 0,
                icmsBaseValue: doc.icmsBaseValue || 0,
                icmsValue: doc.icmsValue || 0,
                ipiValue: doc.ipiValue || 0,
                pisValue: doc.pisValue || 0,
                cofinsValue: doc.cofinsValue || 0,
                icmsstBaseValue: doc.icmsstBaseValue || 0,
                icmsstValue: doc.icmsstValue || 0,
                description: doc.description || '',
                items: doc.items || [],
                services: doc.services || [],
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

  const handleChangeValue = (solicitationId, rowKey, invoiceValue) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: prev[solicitationId].map(r =>
        r.rowKey === rowKey ? { ...r, invoiceValue } : r
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
          id: row.id,
          documentTypeId: row.documentTypeId || '',
          invoiceNumber: row.invoiceNumber || 0,
          invoiceSeries: row.invoiceSeries || '',
          invoiceDate: formattedDate,
          receiptDate: row.receiptDate ? new Date(row.receiptDate).toISOString().split('T')[0] : '',
          invoiceKey: row.invoiceKey || '',
          invoiceValue: row.invoiceValue || 0,
          totalProductsValue: row.totalProductsValue || 0,
          discountValue: row.discountValue || 0,
          freightValue: row.freightValue || 0,
          insuranceValue: row.insuranceValue || 0,
          otherValues: row.otherValues || 0,
          icmsBaseValue: row.icmsBaseValue || 0,
          icmsValue: row.icmsValue || 0,
          ipiValue: row.ipiValue || 0,
          pisValue: row.pisValue || 0,
          cofinsValue: row.cofinsValue || 0,
          icmsstBaseValue: row.icmsstBaseValue || 0,
          icmsstValue: row.icmsstValue || 0,
          description: row.description || '',
          items: row.items || [],
          services: row.services || [],
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
          id: editedForm.id || r.id,
          documentTypeId: editedForm.documentTypeId,
          invoiceNumber: Number(editedForm.invoiceNumber),
          invoiceSeries: editedForm.invoiceSeries,
          invoiceDate: editedForm.invoiceDate,
          receiptDate: editedForm.receiptDate,
          invoiceKey: editedForm.invoiceKey,
          invoiceValue: Number(editedForm.invoiceValue),
          totalProductsValue: Number(editedForm.totalProductsValue),
          discountValue: Number(editedForm.discountValue),
          freightValue: Number(editedForm.freightValue),
          insuranceValue: Number(editedForm.insuranceValue),
          otherValues: Number(editedForm.otherValues),
          icmsBaseValue: Number(editedForm.icmsBaseValue),
          icmsValue: Number(editedForm.icmsValue),
          ipiValue: Number(editedForm.ipiValue),
          pisValue: Number(editedForm.pisValue),
          cofinsValue: Number(editedForm.cofinsValue),
          icmsstBaseValue: Number(editedForm.icmsstBaseValue),
          icmsstValue: Number(editedForm.icmsstValue),
          description: editedForm.description,
          items: editedForm.items || [],
          services: editedForm.services || [],
        } : r
      ),
    }));
    setEditModal({ open: false, rowKey: null, solicitationId: null, initialData: null });
  };

  const handleLinkClick = (event, solicitationId, rowKey) => {
    setLinkModal({ open: true, solicitationId, rowKey });
  };

  const handleLinkClose = () => {
    setLinkModal({ open: false, solicitationId: null, rowKey: null });
  };

  const handleLinkSelect = (doc) => {
    if (!doc || !linkModal.solicitationId) return;

    setRows(prev => ({
      ...prev,
      [linkModal.solicitationId]: prev[linkModal.solicitationId].map(r =>
        r.rowKey === linkModal.rowKey ? {
          ...r,
          id: doc.id,
          documentTypeId: doc.documentModelId || r.documentTypeId,
          invoiceNumber: doc.invoiceNumber || 0,
          invoiceSeries: doc.invoiceSeries || '',
          invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate).toISOString().split('T')[0] : r.invoiceDate,
          receiptDate: doc.receiptDate ? new Date(doc.receiptDate).toISOString().split('T')[0] : '',
          invoiceKey: doc.invoiceKey || '',
          invoiceValue: doc.invoiceValue || 0,
          totalProductsValue: doc.totalProductsValue || 0,
          discountValue: doc.discountValue || 0,
          freightValue: doc.freightValue || 0,
          insuranceValue: doc.insuranceValue || 0,
          otherValues: doc.otherValues || 0,
          icmsBaseValue: doc.icmsBaseValue || 0,
          icmsValue: doc.icmsValue || 0,
          ipiValue: doc.ipiValue || 0,
          pisValue: doc.pisValue || 0,
          cofinsValue: doc.cofinsValue || 0,
          icmsstBaseValue: doc.icmsstBaseValue || 0,
          icmsstValue: doc.icmsstValue || 0,
          description: doc.description || '',
        } : r
      ),
    }));

    handleLinkClose();
  };

  const handleUnlink = (solicitationId, rowKey) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: prev[solicitationId].map(r =>
        r.rowKey === rowKey ? {
          ...r,
          id: null,
          invoiceNumber: 0,
          invoiceDate: new Date().toISOString().split('T')[0],
          invoiceValue: 0
        } : r
      ),
    }));
  };

  const hasAnySelected = Object.values(rows).some(solRows => solRows.some(r => r.checked));

  const handleConfirm = async () => {
    try {

      setSubmitting(true);

      for (const solicitation of solicitations) {

        const solRows = rows[solicitation.id] || [];

        const docs = solRows
          .filter(r => r.checked && r.documentTypeId)
          .map(r => ({
            id: r.id,
            documentModelId: r.documentTypeId,
            invoiceNumber: r.invoiceNumber || 0,
            invoiceSeries: r.invoiceSeries || '',
            invoiceDate: r.invoiceDate ? new Date(r.invoiceDate) : new Date(),
            receiptDate: r.receiptDate ? new Date(r.receiptDate) : null,
            invoiceKey: r.invoiceKey || '',
            invoiceValue: r.invoiceValue || 0,
            totalProductsValue: r.totalProductsValue || 0,
            discountValue: r.discountValue || 0,
            freightValue: r.freightValue || 0,
            insuranceValue: r.insuranceValue || 0,
            otherValues: r.otherValues || 0,
            icmsBaseValue: r.icmsBaseValue || 0,
            icmsValue: r.icmsValue || 0,
            ipiValue: r.ipiValue || 0,
            pisValue: r.pisValue || 0,
            cofinsValue: r.cofinsValue || 0,
            icmsstBaseValue: r.icmsstBaseValue || 0,
            icmsstValue: r.icmsstValue || 0,
            description: r.description || '',
            items: r.items || [],
            services: r.services || [],
          }));

        if (docs.length === 0) continue;

        const result = await solicitationService.saveDocuments(
          solicitation.id,
          docs
        );

        if (result.header.status !== ServiceStatus.SUCCESS)
          throw new Error(result.body.message || 'Erro ao gerar documento.');

      }

      alert.success('Documentos gerados com sucesso!');

      onSave?.();
      onClose();

    } catch (error) {
      alert.error('Erro ao gerar documentos', error?.body?.message || error.message || 'Ocorreu um erro inesperado.');
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
                  onChangeValue={handleChangeValue}
                  onEdit={handleEdit}
                  onLinkClick={handleLinkClick}
                  onUnlink={handleUnlink}
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
        document={editModal.open ? { ...editModal.initialData, id: editModal.initialData?.id || null } : undefined}
        onClose={() => setEditModal({ open: false, rowKey: null, solicitationId: null, initialData: null })}
        onSave={handleSaveEdit}
        manual
      />

      {/* Link Document Modal */}
      <LinkDocumentModal
        open={linkModal.open}
        onClose={handleLinkClose}
        onSelect={handleLinkSelect}
      />

    </Drawer>
  );
}
