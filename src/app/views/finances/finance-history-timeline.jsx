'use client';

import React from 'react';
import {
  Box, Typography, Stack, Paper, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  Schedule as TimeIcon,
  EditNote as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

function formatSqlDate(value) {
  if (!value) return '-';

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-';
    const day = String(value.getUTCDate()).padStart(2, '0');
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const year = value.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const year = parsed.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function TimelineContainer({ children }) {
  return (
    <Box sx={{ p: 0 }}>
      {children}
    </Box>
  );
}

export function InstallmentsNode({ entries, onEdit }) {
  if (!entries?.length) return null;

  return (
    <Box sx={{ px: 3, pt: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
        Títulos e Parcelas Originárias
      </Typography>
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Documento</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Parceiro</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Valor</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Ação</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(entry => (
            <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>{entry.title?.documentNumber}</Typography>
                <Typography variant="caption" color="text.secondary">Parcela {entry.installmentNumber}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{entry.title?.partner?.surname || entry.title?.partner?.name || 'N/A'}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700}>
                  {Number(entry.installmentValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Venc: {entry.dueDate ? format(new Date(entry.dueDate), 'dd/MM/yyyy') : '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <IconButton size="small" color="primary" onClick={() => onEdit?.(entry.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function PaymentNode({ totalValue, date, label }) {

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: -30, width: 2, bgcolor: 'divider' }} />
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <CheckIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
            {label ? label.toUpperCase() : 'PAGAMENTO REALIZADO'}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {Number(totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data da Baixa: {date ? format(new Date(date), 'dd/MM/yyyy') : '-'}
            </Typography>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}

export function CompositionNode({ description, value, methodNumber, id, hasChildren, children }) {
  return (
    <Box sx={{ mb: 4, ml: 4, position: 'relative' }}>
      <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: hasChildren ? -30 : 0, width: 2, bgcolor: 'divider', borderLeft: '2px dashed', borderColor: 'divider' }} />
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <PaymentIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {description ? description.toUpperCase() : 'COMPOSIÇÃO'}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {methodNumber ? `Nº Documento: ${methodNumber}` : 'Sem nº doc.'}
              </Typography>
              {id && <Typography variant="caption" color="text.disabled">(ID: {id})</Typography>}
            </Box>
          </Paper>
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

export function MovementNode({ bank, accountInfo, value, realDate, description, isReconciled, bankMovementCode }) {
  const [bankName, ...rest] = (accountInfo || '').split(' - ');
  const credentials = rest.join(' - ');

  return (
    <Box sx={{ mt: 3, ml: 6 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{
          width: 32, height: 32, borderRadius: 1.5,
          bgcolor: isReconciled ? 'info.main' : 'warning.main',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          overflow: 'hidden'
        }}>
          {bank?.code ? (
            <Box
              component="img"
              src={`/assets/banks/${bank.code}.png`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', bgcolor: 'white' }}
            />
          ) : (
            <BankIcon sx={{ fontSize: 16 }} />
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', lineHeight: 1.2 }}>
              {bankName || (isReconciled ? 'MOVIMENTO CONCILIADO' : 'MOVIMENTO PENDENTE')}
            </Typography>
            {credentials && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                {credentials}
              </Typography>
            )}
          </Box>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5, borderRadius: 2, borderStyle: 'dotted'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
              <Tooltip title="Data Real do Lançamento">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">{realDate ? formatSqlDate(realDate) : 'Aguardando'}</Typography>
                </Stack>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
              "{description || 'Sem descrição no extrato'}"
            </Typography>
            {bankMovementCode && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                (ID: {bankMovementCode})
              </Typography>
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}

const FinanceHistoryTimeline = ({ children }) => {
  return <TimelineContainer>{children}</TimelineContainer>;
};

FinanceHistoryTimeline.Payment = PaymentNode;
FinanceHistoryTimeline.Composition = CompositionNode;
FinanceHistoryTimeline.Movement = MovementNode;
FinanceHistoryTimeline.Installments = InstallmentsNode;

export default FinanceHistoryTimeline;

