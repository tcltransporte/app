'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, CircularProgress,
  Stack, Paper, Tooltip, Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Schedule as TimeIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  ListAlt as ListIcon,
  History as HistoryIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import FinanceEntryModal from '../finance-entry-modal';
import FinanceTitleDetailsDrawer from '../finance-title-details-drawer';

export default function BankMovementTraceDrawer({ open, onClose, movementId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);

  const [entriesOpen, setEntriesOpen] = useState(false);
  const [entriesTitleId, setEntriesTitleId] = useState(null);
  const [entriesDocNumber, setEntriesDocNumber] = useState('');

  const fetchData = useCallback(async () => {
    if (!movementId) return;
    setLoading(true);
    try {
      const result = await financeAction.traceBankMovement(movementId);
      if (result.header.status === ServiceStatus.SUCCESS) {
        setData(result.body);
      }
    } catch (error) {
      console.error('Error tracing movement:', error);
    } finally {
      setLoading(false);
    }
  }, [movementId]);

  useEffect(() => {
    if (open && movementId) {
      fetchData();
    } else if (!open) {
      setData(null);
    }
  }, [open, movementId, fetchData]);

  const handleOpenEntry = (id) => {
    setSelectedEntryId(id);
    setEntryModalOpen(true);
  };

  const handleViewEntries = (titleId, docNumber) => {
    setEntriesTitleId(titleId);
    setEntriesDocNumber(docNumber);
    setEntriesOpen(true);
  };

  const handleEditFromList = (entryId) => {
    setSelectedEntryId(entryId);
    setEntriesOpen(false);
    setEntryModalOpen(true);
  };

  const renderTrace = () => {

    const movement = data;
    const trace = data?.paymentEntry;

    if (!trace) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body1">
            Este movimento bancário foi realizado de forma manual ou não possui rastreio de origem financeira.
          </Typography>
        </Box>
      );
    }

    const payment = trace.payment;
    const entries = payment?.entries || [];

    return (
      <Box sx={{ p: 3 }}>
        {/* Origin: Finance Titles / Entries */}
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: -30, width: 2, bgcolor: 'divider' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <ListIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>ORIGEM FINANCEIRA (TÍTULOS)</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {entries.map((entry) => (
                  <Paper
                    key={entry.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                      position: 'relative'
                    }}
                    onClick={() => handleOpenEntry(entry.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {entry.title?.partner?.name || 'Sem Parceiro'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Doc: {entry.title?.documentNumber} | Parcela: {entry.installmentNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {Number(entry.installmentValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Venc: {entry.dueDate ? format(new Date(entry.dueDate), 'dd/MM/yyyy') : '-'}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                        size="small" 
                        sx={{ 
                            position: 'absolute', 
                            right: -12, 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            bgcolor: 'background.paper', 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            '&:hover': { bgcolor: 'primary.main', color: 'white' },
                            zIndex: 2
                        }}
                    >
                        <OpenIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Step: Consolidated Payment */}
        <Box sx={{ mb: 4, ml: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: -30, width: 2, bgcolor: 'divider', borderLeft: '2px dashed', borderColor: 'divider' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'info.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CheckIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BAIXA CONSOLIDADA (LOTE)</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {payment.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Data da Baixa: {payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : '-'}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>

        {/* Step: Payment Entry (Method Composition) */}
        <Box sx={{ mb: 4, ml: 8, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 16, top: 32, bottom: -30, width: 2, bgcolor: 'divider', borderLeft: '2px dotted', borderColor: 'divider' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'secondary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <PaymentIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>COMPOSIÇÃO DO PAGAMENTO</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {trace.paymentMethod?.description}
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight={600}>
                  {trace.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>

        {/* Final: Bank Movement */}
        <Box sx={{ ml: 12 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '2px solid white', boxShadow: 2 }}>
              <BankIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase' }}>MOVIMENTO NO EXTRATO</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, borderRadius: 2, borderColor: 'primary.light', borderStyle: 'solid', borderWidth: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{movement.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
                  <Typography variant="caption" color="text.secondary">{movement.realDate ? format(new Date(movement.realDate), 'dd/MM/yyyy') : '-'}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                  "{movement.description || 'Sem descrição'}"
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontSize: '10px' }}>
                  CONTA: {movement.bankAccount?.bankName} (Ag: {movement.bankAccount?.agency} / Cc: {movement.bankAccount?.accountNumber})
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 600 }, p: 0 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <HistoryIcon />
              <Typography variant="h6" fontWeight={700}>Rastreio de Origem</Typography>
            </Stack>
            <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative', bgcolor: 'background.default' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              renderTrace()
            )}
          </Box>
        </Box>
      </Drawer>

        <FinanceEntryModal
          open={entryModalOpen}
          onClose={() => setEntryModalOpen(false)}
          entryId={selectedEntryId}
          onSuccess={() => {
            fetchData();
          }}
          onViewEntries={handleViewEntries}
          zIndex={3000} // Ensure it's above everything
        />


      <FinanceTitleDetailsDrawer
        open={entriesOpen}
        onClose={() => setEntriesOpen(false)}
        titleId={entriesTitleId}
        documentNumber={entriesDocNumber}
        onEditEntry={handleEditFromList}
        onTop={true} 
      />
    </>
  );
}

