'use client';

import React from 'react';
import { Container, Table, Toolbar } from '@/components/common';
import { RangeModal } from '@/components/common';
import { useTable, useLoading } from '@/hooks';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import UnifiedChip from '@/components/common/UnifiedChip';
import { Box, Badge, Button, Avatar } from '@mui/material';
import {
  Search as SearchIcon,
  LockOpen as OpenIcon,
  Lock as CloseIcon,
  Event as EventIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';

export default function CashClosureList({ initialTable, initialDate }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const [selectedDate, setSelectedDate] = React.useState(initialDate);
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [runningBankAccountId, setRunningBankAccountId] = React.useState(null);

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeAction.findCashClosuresByDate({
        date: overrides.date || selectedDate
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
    setRunningBankAccountId(row.bankAccountId);
    try {
      const result = await financeAction.closeCashClosure({
        bankAccountId: row.bankAccountId,
        date: selectedDate
      });
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      alert.success('Caixa fechado com sucesso');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível fechar o caixa', error?.body?.message || error.message);
    } finally {
      setRunningBankAccountId(null);
    }
  }, [selectedDate, fetchTable]);

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
      width: 160,
      align: 'center',
      renderCell: (value, row) => (
        <UnifiedChip
          label={value || 'Fechado'}
          color={Number(row.statusId) === 1 ? 'success' : Number(row.statusId) === 2 ? 'error' : 'default'}
          variant="outlined"
        />
      )
    },
    {
      field: 'action',
      headerName: 'Ação',
      width: 170,
      align: 'center',
      sortable: false,
      renderCell: (value, row) => (
        Number(row.statusId) === 1 ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleCloseCash(row);
            }}
            disabled={runningBankAccountId === row.bankAccountId}
          >
            Fechar
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<OpenIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCash(row);
            }}
            disabled={runningBankAccountId === row.bankAccountId}
          >
            Abrir
          </Button>
        )
      )
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
              label: selectedDate ? `Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : 'Data',
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
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
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
          const nextDate = vals?.start || initialDate;
          setSelectedDate(nextDate);
          fetchTable({ date: nextDate });
        }}
      />
    </Container>
  );
}
