'use client';

import React from 'react';
import { Container, Table, Toolbar } from '@/components/common';
import { RangeModal } from '@/components/common';
import { useTable, useLoading } from '@/hooks';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import UnifiedChip from '@/components/common/UnifiedChip';
import { Box, Badge, Avatar } from '@mui/material';
import {
  Search as SearchIcon,
  LockOpen as OpenIcon,
  Lock as CloseIcon,
  Event as EventIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import CashCloseConfirmDrawer from './cash-close-confirm-drawer';

export default function CashClosureList({ initialTable, initialDate }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const [selectedDate, setSelectedDate] = React.useState(initialDate);
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [runningBankAccountId, setRunningBankAccountId] = React.useState(null);
  const [closeDrawerOpen, setCloseDrawerOpen] = React.useState(false);
  const [closeTargetRow, setCloseTargetRow] = React.useState(null);

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeAction.findCashClosuresByDate({
        date: overrides.date ?? selectedDate,
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        sortBy: table.sortBy || 'date',
        sortOrder: table.sortOrder || 'DESC'
      });
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      table.setItems(result.body.rows || []);
      table.setTotal(result.body.count || 0);
      table.setSelecteds([]);
      return true;
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message);
      return false;
    } finally {
      table.setLoading(false);
      loading.hide();
    }
  }, [selectedDate, table, loading]);

  const handleOpenCash = React.useCallback(async (row) => {
    setRunningBankAccountId(row.bankAccountId);
    try {
      const result = await financeAction.openCashClosure({
        bankAccountId: row.bankAccountId,
        date: selectedDate
      });
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      alert.success('Caixa aberto com sucesso');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível abrir o caixa', error?.body?.message || error.message);
    } finally {
      setRunningBankAccountId(null);
    }
  }, [selectedDate, fetchTable]);

  const handleCloseCash = React.useCallback(async (row) => {
    setCloseTargetRow(row);
    setCloseDrawerOpen(true);
  }, []);

  const handleConfirmCloseCash = React.useCallback(async () => {
    if (!closeTargetRow) return;
    setRunningBankAccountId(closeTargetRow.bankAccountId);
    try {
      const result = await financeAction.closeCashClosure({
        bankAccountId: closeTargetRow.bankAccountId,
        date: selectedDate
      });
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      alert.success('Caixa fechado com sucesso');
      await fetchTable();
      setCloseDrawerOpen(false);
      setCloseTargetRow(null);
    } catch (error) {
      alert.error('Não foi possível fechar o caixa', error?.body?.message || error.message);
    } finally {
      setRunningBankAccountId(null);
    }
  }, [closeTargetRow, selectedDate, fetchTable]);

  const columns = React.useMemo(() => [
    {
      field: 'bankAccount',
      headerName: 'Conta Bancária',
      width: 320,
      renderCell: (value, row) => {
        const account = row.bankAccount || {};
        const bankIcon = account?.bank?.code ? `/assets/banks/${account.bank.code}.png` : undefined;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              variant="rounded"
              src={bankIcon}
              alt={account?.bank?.description || account.bankName || 'Banco'}
              sx={{
                width: 20,
                height: 20,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
              imgProps={{ loading: 'lazy' }}
            >
              <BankIcon sx={{ fontSize: 14 }} />
            </Avatar>
            <span>{account.description || ''}</span>
          </Box>
        );
      }
    },
    {
      field: 'date',
      headerName: 'Data',
      width: 140,
      align: 'center',
      renderCell: (value) => {
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : '';
      }
    },
    {
      field: 'statusText',
      headerName: 'Status',
      width: 190,
      align: 'center',
      renderCell: (value, row) => {
        const isOpen = Number(row.statusId) === 1;
        const isRunning = runningBankAccountId === row.bankAccountId;
        return (
        <UnifiedChip
          label={isOpen ? 'Aberto' : 'Fechado'}
          color={isOpen ? 'success' : 'error'}
          variant="outlined"
          actionLabel={isOpen ? 'Fechar' : 'Abrir'}
          actionIcon={isOpen ? <CloseIcon fontSize="small" /> : <OpenIcon fontSize="small" />}
          actionColor={isOpen ? 'error' : 'success'}
          onActionClick={() => {
            if (isRunning) return;
            if (isOpen) {
              handleCloseCash(row);
            } else {
              handleOpenCash(row);
            }
          }}
          showActionOnHover
          actionSx={{ minWidth: 92, opacity: isRunning ? 0.7 : 1, pointerEvents: isRunning ? 'none' : 'auto' }}
        />
      ) }
    }
  ], [handleOpenCash, handleCloseCash, runningBankAccountId]);

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length, columns, table]);

  return (
    <Container>
      <Container.Title items={[{ label: 'Finanças' }, { label: 'Fechamento' }]} />

      <Container.Content>
        <Toolbar
          secondary={[
            {
              label: selectedDate ? `Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : 'Todo o período',
              icon: <EventIcon fontSize="small" />,
              onClick: () => setRangeOpen(true)
            },
            {
              label: 'Pesquisar',
              icon: <SearchIcon fontSize="small" />,
              variant: 'outlined',
              color: 'primary',
              onClick: () => fetchTable()
            }
          ]}
        />

        <Table
          columns={table.orderedColumns.length > 0 ? table.orderedColumns : columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onColumnsReorder={table.setOrderedColumns}
          widths={table.columnWidths}
          onResize={table.handleColumnResize}
          loading={table.loading}
          fixed
        />
      </Container.Content>

      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        selectedCount={table.selecteds.length}
        onPageChange={async (e, p) => {
          const ok = await fetchTable({ page: p });
          if (ok) table.setPage(p);
        }}
        onRowsPerPageChange={async (e) => {
          const l = Number(e.target.value);
          const ok = await fetchTable({ page: 1, rowsPerPage: l });
          if (ok) {
            table.setRowsPerPage(l);
            table.setPage(1);
          }
        }}
      />

      <RangeModal
        open={rangeOpen}
        onClose={() => setRangeOpen(false)}
        title="Filtrar por Data"
        initialField="date"
        initialStart={selectedDate}
        initialEnd={selectedDate}
        fieldOptions={[{ label: 'Data', value: 'date' }]}
        onApply={(vals) => {
          const nextDate = vals?.start || vals?.end || initialDate;
          setSelectedDate(nextDate);
          fetchTable({ date: nextDate });
        }}
      />

      <CashCloseConfirmDrawer
        open={closeDrawerOpen}
        onClose={() => {
          setCloseDrawerOpen(false);
          setCloseTargetRow(null);
        }}
        bankAccount={closeTargetRow?.bankAccount}
        selectedDate={selectedDate}
        onConfirm={handleConfirmCloseCash}
      />
    </Container>
  );
}
