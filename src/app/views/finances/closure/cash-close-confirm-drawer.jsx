'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Lock as CloseCashIcon,
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  AccountBalanceWallet as BalanceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CashCloseConfirmDrawer({ open, onClose, bankAccount, selectedDate, onConfirm }) {
  const [loading, setLoading] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [summary, setSummary] = React.useState({ totalIn: 0, totalOut: 0, balance: 0, count: 0 });
  const [rows, setRows] = React.useState([]);
  const [expandByMethod, setExpandByMethod] = React.useState(false);
  const [expandedMethods, setExpandedMethods] = React.useState({});

  const loadSummary = React.useCallback(async () => {
    if (!open || !bankAccount?.id || !selectedDate) return;
    setLoading(true);
    try {
      const result = await financeAction.findAllBankMovements({
        page: 1,
        limit: 1000,
        where: { bankAccountId: bankAccount.id },
        filters: { status: 'conciled' },
        range: { start: selectedDate, end: selectedDate, field: 'realDate' },
        includePaymentMethod: true,
        sortBy: 'realDate',
        sortOrder: 'ASC'
      });
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      const rows = result.body?.rows || [];
      const totalIn = rows
        .filter((item) => Number(item.typeId) === 1)
        .reduce((acc, item) => acc + (Number(item.value) || 0), 0);
      const totalOut = rows
        .filter((item) => Number(item.typeId) === 2)
        .reduce((acc, item) => acc + (Number(item.value) || 0), 0);

      setSummary({
        totalIn,
        totalOut,
        balance: totalIn - totalOut,
        count: rows.length
      });
      setRows(rows);
      setExpandedMethods({});
    } catch (error) {
      alert.error('Não foi possível carregar resumo do caixa', error?.body?.message || error.message);
      setSummary({ totalIn: 0, totalOut: 0, balance: 0, count: 0 });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, bankAccount?.id, selectedDate]);

  React.useEffect(() => {
    if (open) {
      loadSummary();
    }
  }, [open, loadSummary]);

  const handleConfirm = async () => {
    if (!bankAccount?.id || !selectedDate) return;
    setConfirming(true);
    try {
      await onConfirm?.();
      onClose?.();
    } finally {
      setConfirming(false);
    }
  };

  const movementGroups = React.useMemo(() => {
    const groups = {};
    for (const item of rows) {
      const methodLabel = item?.paymentEntry?.paymentMethod?.description || 'Sem forma de pagamento';
      if (!groups[methodLabel]) {
        groups[methodLabel] = {
          method: methodLabel,
          total: 0,
          count: 0,
          movements: []
        };
      }
      groups[methodLabel].total += Number(item.value) || 0;
      groups[methodLabel].count += 1;
      groups[methodLabel].movements.push(item);
    }
    return Object.values(groups).sort((a, b) => a.method.localeCompare(b.method));
  }, [rows]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 0 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh / var(--app-zoom, 1))' }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CloseCashIcon />
            <Typography variant="subtitle1" fontWeight={700}>
              Fechar Caixa
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Conta bancária
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            {bankAccount?.description || '-'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Data de fechamento
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : '-'}
          </Typography>

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            {loading ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InIcon color="success" fontSize="small" />
                    <Typography variant="body2">Entradas</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700} color="success.main">{currency(summary.totalIn)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <OutIcon color="error" fontSize="small" />
                    <Typography variant="body2">Saídas</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700} color="error.main">{currency(summary.totalOut)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BalanceIcon color="primary" fontSize="small" />
                    <Typography variant="body2">Saldo do dia</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700}>{currency(summary.balance)}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Lançamentos conciliados no dia: {summary.count}
                </Typography>
              </Stack>
            )}
          </Paper>

          {!loading && (
            <Paper variant="outlined" sx={{ p: 1.25, mt: 1.5 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => setExpandByMethod((prev) => !prev)}
                endIcon={expandByMethod ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', textTransform: 'none', fontWeight: 700 }}
              >
                Resumo por forma de pagamento
              </Button>

              {expandByMethod && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {movementGroups.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Nenhum movimento conciliado para exibir.
                    </Typography>
                  ) : movementGroups.map((group) => {
                    const groupOpen = !!expandedMethods[group.method];
                    return (
                      <Paper key={group.method} variant="outlined" sx={{ p: 1 }}>
                        <Button
                          fullWidth
                          variant="text"
                          onClick={() => setExpandedMethods((prev) => ({ ...prev, [group.method]: !groupOpen }))}
                          endIcon={groupOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ justifyContent: 'space-between', textTransform: 'none', fontWeight: 600, px: 0.5 }}
                        >
                          {`${group.method} (${group.count})`}
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, pb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Total</Typography>
                          <Typography variant="caption" fontWeight={700}>{currency(group.total)}</Typography>
                        </Box>
                        {groupOpen && (
                          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                            {group.movements.map((movement) => (
                              <Box
                                key={movement.id}
                                sx={{ px: 0.5, py: 0.5, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', gap: 1 }}
                              >
                                <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {movement.description || `Movimento #${movement.id}`}
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>
                                  {currency(movement.value)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          )}
        </Box>

        <Divider />
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper' }}>
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" color="inherit" onClick={onClose} disabled={confirming}>
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<CloseCashIcon />}
              onClick={handleConfirm}
              disabled={confirming || loading}
            >
              {confirming ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
