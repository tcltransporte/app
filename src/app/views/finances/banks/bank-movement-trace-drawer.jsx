'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, CircularProgress,
  Stack, Paper, Tooltip, Table, TableBody, TableCell, TableHead, TableRow, Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Schedule as TimeIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  EditNote as EditIcon,
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

  const renderHistory = () => {
    const payment = data?.paymentEntry?.payment;
    const currentMovement = data;

    if (!payment) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body1">
                Este movimento bancário foi realizado de forma manual ou não possui rastreio de origem financeira.
              </Typography>
            </Box>
        );
    }


    return (
      <Box sx={{ p: 3 }}>
        {/* Step 1: Payment Header (Identical to renderHistory) */}
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: -30, width: 2, bgcolor: 'divider' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CheckIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>PAGAMENTO REALIZADO</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {payment.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data da Baixa: {payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : '-'}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>

        {/* Payment Entries Loop (Identical to renderHistory) */}
        {(payment.paymentEntries || []).map((entry) => (
          <Box key={entry.id} sx={{ mb: 4, ml: 4, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: (entry.bankMovements?.length > 0) ? -30 : 0, width: 2, bgcolor: 'divider', borderLeft: '2px dashed', borderColor: 'divider' }} />
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <PaymentIcon fontSize="small" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {entry.paymentMethod?.description ? entry.paymentMethod.description.toUpperCase() : 'COMPOSIÇÃO'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {entry.paymentMethodNumber ? `Nº Documento: ${entry.paymentMethodNumber}` : 'Sem nº doc.'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">(ID: {entry.id})</Typography>
                  </Box>
                </Paper>
              </Box>
            </Stack>

            {/* Bank Movements Loop (Identical to renderHistory) */}
            {(entry.bankMovements || []).map((move) => {
              const isActive = move.id === currentMovement.id;
              return (
                <Box key={move.id} sx={{ mt: 3, ml: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        bgcolor: isActive ? 'primary.main' : (move.isReconciled ? 'info.main' : 'warning.main'), 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                        boxShadow: isActive ? 4 : 0,
                        border: isActive ? '2px solid white' : 'none'
                    }}>
                      <BankIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {move.bankAccount?.bank?.description && (
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                          {move.bankAccount.bank.description}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: move.isReconciled ? 'info.main' : 'warning.main', textTransform: 'uppercase' }}>
                        {move.bankAccount ? `${move.bankAccount.bankName} - Ag: ${move.bankAccount.agency} / Cc: ${move.bankAccount.accountNumber}` : (move.isReconciled ? 'MOVIMENTO CONCILIADO' : 'MOVIMENTO PENDENTE')}
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 1.5, mt: 0.5, borderRadius: 2, borderStyle: 'dotted',
                            ...(isActive ? { borderColor: 'primary.main', bgcolor: 'primary.light', borderStyle: 'solid', borderWidth: 2, opacity: 0.9 } : {})
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{Number(move.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
                          <Tooltip title="Data Real do Lançamento">
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">{move.realDate ? format(new Date(move.realDate), 'dd/MM/yyyy') : 'Aguardando'}</Typography>
                            </Stack>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                          "{move.description || 'Sem descrição no extrato'}"
                        </Typography>
                        {isActive && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: 'primary.main' }}>
                                ESTE É O MOVIMENTO SELECIONADO
                            </Typography>
                        )}
                      </Paper>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  const renderInstallmentsHeader = () => {
    const payment = data?.paymentEntry?.payment;
    if (!payment?.entries?.length) return null;
    const entries = payment.entries;


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
                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{entry.title?.partner?.name || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2" fontWeight={700}>{Number(entry.installmentValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
                                <Typography variant="caption" color="text.secondary">Venc: {entry.dueDate ? format(new Date(entry.dueDate), 'dd/MM/yyyy') : '-'}</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEntry(entry.id)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
              <Divider sx={{ my: 3 }} />
        </Box>
    )
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 700 }, p: 0 }
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
             <>
                {renderInstallmentsHeader()}
                {renderHistory()}
             </>
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
          zIndex={3000} 
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
