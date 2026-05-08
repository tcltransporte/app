'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Stack,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import * as paymentAction from '@/app/actions/payment.action';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import FinanceHistoryTimeline from './finance-history-timeline';
import FinanceEntryModal from './finance-entry-modal';

export default function FinancePaymentHistoryDrawer({ entryIds, open, onClose, onSuccess, zIndex, operationType }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [selectedEntryId, setSelectedEntryId] = React.useState(null);
  const [entryModalOpen, setEntryModalOpen] = React.useState(false);
  const [reverseRunning, setReverseRunning] = React.useState(false);

  const handleOpenEntry = (id) => {
    setSelectedEntryId(id);
    setEntryModalOpen(true);
    onClose?.();
  };

  const handleReverseSettlement = async () => {
    const paymentId = data?.payment?.id;
    if (!paymentId) return;

    const verb = Number(operationType) === 1 ? 'recebimento' : 'pagamento';
    const ok = await alert.confirm(
      `Desfazer ${verb}?`,
      'Isso remove os lançamentos de extrato da baixa, exclui o pagamento e devolve a(s) parcela(s) para aberto.',
      'warning'
    );
    if (!ok) return;

    setReverseRunning(true);
    try {
      const result = await financeAction.reverseSettlementFromPayment(paymentId);
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      alert.success('Baixa desfeita');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      alert.error('Não foi possível desfazer', error?.body?.message || error.message);
    } finally {
      setReverseRunning(false);
    }
  };

  const fetchHistory = React.useCallback(async () => {
    const ids = (Array.isArray(entryIds) ? entryIds : [entryIds])
      .filter(Boolean)
      .map(item => (typeof item === 'object' && item !== null ? item.id : item))
      .map(Number)
      .filter(id => !isNaN(id));

    if (ids.length === 0) return;

    setLoading(true);
    try {
      const result = await paymentAction.fetchHistory(ids);

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw new Error(result.body?.message || 'Erro ao buscar histórico');
      }

      const historyData = result.body;
      setData(historyData);

      if (!historyData.payment) {
        throw new Error('As parcelas selecionadas ainda não possuem histórico de baixa.');
      }

    } catch (error) {
      console.error('Error fetching payment history:', error);
      alert.error('Erro!', error?.message || 'Não foi possível carregar o histórico de pagamento.');
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [entryIds, onClose]);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    } else {
      setData(null);
    }
  }, [open, fetchHistory]);

  const renderHistory = () => {
    if (!data?.payment) return null;
    const { payment } = data;

    return (
      <Box sx={{ p: 3 }}>
        <FinanceHistoryTimeline>
          <FinanceHistoryTimeline.Payment
            totalValue={payment.totalValue}
            date={payment.date}
            label={operationType === 1 ? 'RECEBIDO' : 'PAGO'}
          />

          {(payment.paymentEntries || []).map((entry) => (
            <FinanceHistoryTimeline.Composition
              key={entry.id}
              description={entry.paymentMethod?.description}
              value={entry.value}
              methodNumber={entry.paymentMethodNumber}
              id={entry.id}
              hasChildren={entry.bankMovements?.length > 0}
            >
              {(entry.bankMovements || []).map((move) => (
                <FinanceHistoryTimeline.Movement
                  key={move.id}
                  bank={move.bankAccount?.bank}
                  accountInfo={
                    move.bankAccount
                      ? `${move.bankAccount.description || move.bankAccount.descricao || ''} - Ag: ${move.bankAccount.agency} / Cc: ${move.bankAccount.accountNumber}`
                      : null
                  }
                  value={move.value}
                  realDate={move.realDate}
                  description={move.description}
                  isReconciled={move.isConciled}
                  bankMovementCode={move.codigo_movimento_bancario || move.id}
                />
              ))}
            </FinanceHistoryTimeline.Composition>
          ))}
        </FinanceHistoryTimeline>
      </Box>
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ zIndex: zIndex || ((theme) => theme.zIndex.modal + 2) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 900 }, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryIcon />
                  <Typography variant="subtitle1" fontWeight={700}>
                    {loading ? 'Carregando...' : 'Histórico de Pagamento'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {!loading && data?.payment && (
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      disabled={reverseRunning}
                      startIcon={<UndoIcon />}
                      onClick={handleReverseSettlement}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        color: (theme) => theme.palette.grey[900],
                      }}
                    >
                      Desfazer {Number(operationType) === 1 ? 'recebimento' : 'pagamento'}
                    </Button>
                  )}
                  <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0, position: 'relative', bgcolor: 'background.default' }}>
                {loading ? (
                  <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(0,0,0,0.6)'
                      : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 10,
                  }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Buscando informações...
                    </Typography>
                  </Box>
                ) : data?.payment ? (
                  <>
                    <FinanceHistoryTimeline.Installments 
                      entries={data.payment.entries} 
                      onEdit={handleOpenEntry}
                    />
                    {renderHistory()}
                  </>
                ) : null}
              </Box>
        </Box>
      </Drawer>

      <FinanceEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        entryId={selectedEntryId}
        onSuccess={() => {
          fetchHistory();
          onSuccess?.();
        }}
        zIndex={3000}
      />
    </>
  );
}
