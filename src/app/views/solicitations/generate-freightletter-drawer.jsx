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
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { SelectField, NumericField, TextField } from '@/components/controls';
import * as freightLetterAction from '@/app/actions/freightLetter.action';
import * as solicitationAction from '@/app/actions/solicitation.action';
import { FreightLetterDetail } from '../freight-letters/freight-letter-detail';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

function SolicitationRow({ solicitation, componentTypes, rows, onAdd, onEdit, onDelete, alreadyGenerated }) {
  const [expanded, setExpanded] = React.useState(true);

  const solRows = rows[solicitation.id] || [];
  const totalValue = solRows.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  const totalPayments = (solicitation.payments || []).reduce((sum, p) => sum + (Number(p.value) || 0), 0);

  const isDivergent = Math.abs(totalValue - totalPayments) > 0.01;

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
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            {isDivergent && (
              <Tooltip title={`Divergência: Carta Frete (R$ ${totalValue.toFixed(2)}) ≠ Pagamentos (R$ ${totalPayments.toFixed(2)})`}>
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
            {alreadyGenerated ? (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 1, m: 1 }}>
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  As cartas de frete para esta solicitação já foram geradas.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', py: 0.75 }}>Tipo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.725rem', py: 0.75, width: 100 }}>Valor (R$)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.725rem', py: 0.75, width: 90 }}>Desc. (R$)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', py: 0.75 }}>Protocolo / Ref</TableCell>
                    <TableCell align="right" sx={{ py: 0.75, width: 70 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solRows.map((row) => (
                    <TableRow key={row.rowKey} hover>
                      <TableCell sx={{ fontSize: '0.825rem', py: 0.5 }}>
                        {componentTypes.find(ct => ct.id === row.freightLetterComponentTypeId)?.description || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.825rem', py: 0.5 }}>
                        {Number(row.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.825rem', py: 0.5 }}>
                        {Number(row.discountValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.825rem', py: 0.5, color: 'text.secondary' }}>
                        {row.operatorProtocol || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton size="small" onClick={() => onEdit(solicitation.id, row)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => onDelete(solicitation.id, row.rowKey)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {solRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Nenhuma carta frete adicionada.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0.5 }}>
                      <Button
                        size="small"
                        onClick={() => onAdd(solicitation.id)}
                        disabled={alreadyGenerated}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.lighter' }
                        }}
                      >
                        + Adicionar
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function GenerateFreightLetterDrawer({ open, solicitations = [], onClose, onSave }) {
  const [componentTypes, setComponentTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [rows, setRows] = React.useState({});
  const [statusMap, setStatusMap] = React.useState({});

  const [detailModal, setDetailModal] = React.useState({ open: false, solicitationId: null, data: null });

  const formatRowData = (fl, solId, index) => ({
    rowKey: fl.id ? `existing-${fl.id}` : `new-${solId}-${index}-${Date.now()}`,
    id: fl.id || null,
    freightLetterComponentTypeId: fl.freightLetterComponentTypeId || '',
    value: fl.value || 0,
    discountValue: fl.discountValue || 0,
    operatorProtocol: fl.operatorProtocol || '',
    description: fl.description || '',
    effectiveDate: fl.effectiveDate || new Date().toISOString().split('T')[0],
    tripId: fl.tripId || null,
    tripTravelId: fl.tripTravelId || null,
    solicitationId: solId,
    payeeId: fl.payeeId || null,
    payee: fl.payee || null,
    cardNumber: fl.cardNumber || '',
  });

  React.useEffect(() => {
    if (!open || solicitations.length === 0) return;
    setLoading(true);

    Promise.all([
      freightLetterAction.findAllComponentTypes(),
      solicitationAction.generateFreightLetters(solicitations.map(s => s.id))
    ]).then(([typesResult, flsResult]) => {
      if (typesResult.header.status === ServiceStatus.SUCCESS) {
        setComponentTypes(typesResult.body || []);
      }

      if (flsResult.header.status === ServiceStatus.SUCCESS) {
        const initial = {};
        const initialStatus = {};
        const items = flsResult.body.items || [];

        items.forEach(s => {
          initial[s.id] = (s.freightLetters || []).map((fl, idx) => formatRowData(fl, s.id, idx));
          initialStatus[s.id] = !!s.alreadyGenerated;
        });

        solicitations.forEach(s => { if (!initial[s.id]) initial[s.id] = []; });

        setRows(initial);
        setStatusMap(initialStatus);
      }
    }).finally(() => setLoading(false));
  }, [open, solicitations]);

  const handleAddRow = (solicitationId) => {
    const solicitation = solicitations.find(s => s.id === solicitationId);
    const existingRows = rows[solicitationId] || [];

    const totalPayments = (solicitation?.payments || []).reduce((sum, p) => sum + (Number(p.value) || 0), 0);
    const currentTotal = existingRows.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    const remainingValue = Math.max(0, totalPayments - currentTotal);

    setDetailModal({
      open: true,
      solicitationId,
      data: {
        payee: solicitation?.partner || null,
        payeeId: solicitation?.partner?.id || null,
        value: remainingValue,
      }
    });
  };

  const handleEditRow = (solicitationId, row) => {
    setDetailModal({ open: true, solicitationId, data: row });
  };

  const handleDeleteRow = (solicitationId, rowKey) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: (prev[solicitationId] || []).filter(r => r.rowKey !== rowKey)
    }));
  };

  const handleSaveDetail = (data) => {
    const solId = detailModal.solicitationId;
    const isEdit = !!data.rowKey;

    setRows(prev => {
      const currentRows = prev[solId] || [];
      let nextRows;

      if (isEdit) {
        nextRows = currentRows.map(r => r.rowKey === data.rowKey ? { ...r, ...data } : r);
      } else {
        nextRows = [...currentRows, formatRowData(data, solId, currentRows.length)];
      }

      return { ...prev, [solId]: nextRows };
    });
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);

      for (const solicitation of solicitations) {
        const fls = (rows[solicitation.id] || []).map(r => ({
          ...r,
          effectiveDate: new Date(r.effectiveDate),
          payeeId: r.payee?.id || r.payeeId
        }));

        if (statusMap[solicitation.id] || fls.length === 0) continue;

        const result = await solicitationAction.saveFreightLetters(solicitation.id, fls);
        if (result.header.status !== ServiceStatus.SUCCESS)
          throw new Error(result.body.message || 'Erro ao gerar carta de frete.');
      }

      alert.success('Cartas de frete geradas com sucesso!');
      onSave?.();
      onClose();
    } catch (error) {
      alert.error('Erro ao gerar cartas de frete', error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 700 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Typography variant="h6" fontWeight={600}>Gerar cartas de frete</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Divider />

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
                  componentTypes={componentTypes}
                  rows={rows}
                  onAdd={handleAddRow}
                  onEdit={handleEditRow}
                  onDelete={handleDeleteRow}
                  alreadyGenerated={statusMap[s.id]}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <Divider />
      <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2 }}>
        <Button fullWidth variant="outlined" disabled={submitting} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={loading || submitting || solicitations.every(s => statusMap[s.id])}
          onClick={handleConfirm}
        >
          {submitting ? 'Gerando...' : 'Confirmar'}
        </Button>
      </Box>

      <FreightLetterDetail
        open={detailModal.open}
        freightLetter={detailModal.data}
        componentTypes={componentTypes}
        onClose={() => setDetailModal({ ...detailModal, open: false })}
        onSave={handleSaveDetail}
      />
    </Drawer>
  );
}
