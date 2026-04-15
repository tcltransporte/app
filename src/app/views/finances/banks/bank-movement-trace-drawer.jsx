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
import FinanceHistoryTimeline from '../finance-history-timeline';

export default function BankMovementTraceDrawer({ open, onClose, movementId, onSuccess }) {

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
        <FinanceHistoryTimeline>
          <FinanceHistoryTimeline.Payment
            totalValue={payment.totalValue}
            date={payment.date}
            label={currentMovement?.typeId === 1 ? 'RECEBIDO' : 'PAGO'}
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
                  accountInfo={move.bankAccount ? `${move.bankAccount.bankName} - Ag: ${move.bankAccount.agency} / Cc: ${move.bankAccount.accountNumber}` : null}
                  value={move.value}
                  realDate={move.realDate}
                  description={move.description}
                  isReconciled={move.isReconciled}
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
                <FinanceHistoryTimeline.Installments
                  entries={data?.paymentEntry?.payment?.entries}
                  onEdit={handleOpenEntry}
                />
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
          if (onSuccess) onSuccess();
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
        operationType={data?.typeId}
      />
    </>
  );
}
