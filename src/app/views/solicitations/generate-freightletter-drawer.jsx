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
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { SelectField, NumericField, TextField } from '@/components/controls';
import * as freightLetterAction from '@/app/actions/freightLetter.action';
import * as solicitationAction from '@/app/actions/solicitation.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

function SolicitationRow({ solicitation, componentTypes, rows, onChangeType, onChangeValue, onChangeDiscount, onChangeDescription, onChangeProtocol, alreadyGenerated }) {
  const [expanded, setExpanded] = React.useState(true);

  const solRows = rows[solicitation.id] || [];
  const totalValue = solRows.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  const totalDiscount = solRows.reduce((sum, r) => sum + (Number(r.discountValue) || 0), 0);

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
          <Typography variant="body2" fontWeight={700} color="primary">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Tipo</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>Valor (R$)</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>Desc. (R$)</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Protocolo / Ref</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solRows.map((row) => (
                    <TableRow key={row.rowKey} hover>
                      <TableCell>
                        <SelectField
                          label="Tipo"
                          value={row.freightLetterComponentTypeId || ''}
                          onChange={(val) => onChangeType(solicitation.id, row.rowKey, val)}
                          options={componentTypes.map(ct => ({ value: ct.id, label: ct.description }))}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericField
                          label="Valor"
                          value={row.value || 0}
                          onChange={(val) => onChangeValue(solicitation.id, row.rowKey, val)}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericField
                          label="Desconto"
                          value={row.discountValue || 0}
                          onChange={(val) => onChangeDiscount(solicitation.id, row.rowKey, val)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          label="Protocolo / Descrição"
                          value={row.operatorProtocol || ''}
                          onChange={(e) => onChangeProtocol(solicitation.id, row.rowKey, e.target.value)}
                          placeholder="Protocolo operadora..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {solRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="caption" color="text.secondary">Nenhum componente configurado.</Typography>
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

export function GenerateFreightLetterDrawer({ open, solicitations = [], onClose, onSave }) {
  const [componentTypes, setComponentTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [rows, setRows] = React.useState({});
  const [statusMap, setStatusMap] = React.useState({});

  const formatRowData = (fl, solId, index) => ({
    rowKey: fl.id ? `existing-${fl.id}` : `new-${solId}-${index}`,
    id: fl.id || null,
    freightLetterComponentTypeId: fl.freightLetterComponentTypeId || 1,
    value: fl.value || 0,
    discountValue: fl.discountValue || 0,
    operatorProtocol: fl.operatorProtocol || '',
    description: fl.description || '',
    effectiveDate: fl.effectiveDate || new Date().toISOString().split('T')[0],
    tripId: fl.tripId || null,
    groupId: fl.groupId || null,
  });

  const updateRow = (solicitationId, rowKey, next) => {
    setRows(prev => ({
      ...prev,
      [solicitationId]: (prev[solicitationId] || []).map(r =>
        r.rowKey === rowKey ? { ...r, ...next } : r
      ),
    }));
  };

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

  const handleChangeType = (solicitationId, rowKey, freightLetterComponentTypeId) => updateRow(solicitationId, rowKey, { freightLetterComponentTypeId });
  const handleChangeValue = (solicitationId, rowKey, value) => updateRow(solicitationId, rowKey, { value });
  const handleChangeDiscount = (solicitationId, rowKey, discountValue) => updateRow(solicitationId, rowKey, { discountValue });
  const handleChangeProtocol = (solicitationId, rowKey, operatorProtocol) => updateRow(solicitationId, rowKey, { operatorProtocol });

  const handleConfirm = async () => {
    try {
      setSubmitting(true);

      for (const solicitation of solicitations) {
        const fls = (rows[solicitation.id] || []).map(r => ({
          ...r,
          effectiveDate: new Date(r.effectiveDate),
        }));

        if (fls.length === 0 || statusMap[solicitation.id]) continue;

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
                  onChangeType={handleChangeType}
                  onChangeValue={handleChangeValue}
                  onChangeDiscount={handleChangeDiscount}
                  onChangeProtocol={handleChangeProtocol}
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
    </Drawer>
  );
}
