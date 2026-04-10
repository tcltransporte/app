'use client';

import React from 'react';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useLoading, useRangeFilter, useExport } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { IconButton, Tooltip, Box, Typography, Chip } from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  CheckCircle as CheckIcon,
  AccountBalance as BankIcon,
  ArrowCircleUp as UpIcon,
  ArrowCircleDown as DownIcon,
} from '@mui/icons-material';

export default function BankMovementsList({ title, initialTable, initialRange }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const exporter = useExport();

  const rangeFilter = useRangeFilter({
    initialRange,
    dateFieldOptions: [
      { label: 'Data Real', value: 'realDate' },
      { label: 'Data de Lançamento', value: 'entryDate' },
    ]
  });

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeAction.findAllBankMovements({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        where: overrides.where || {},
        range: overrides.range || rangeFilter.range,
        sortBy: overrides.sortBy || table.sortBy || undefined,
        sortOrder: overrides.sortOrder || table.sortOrder || undefined
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
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, rangeFilter.range]);

  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchTable();
  }, [fetchTable]);

  const columns = [
    {
      field: 'realDate', headerName: 'Data Real', width: 120, align: 'center',
      renderCell: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : ''
    },
    {
      field: 'bankAccount', headerName: 'Conta', width: 220,
      renderCell: (val, row) => {
        const acc = row.bankAccount;
        if (!acc) return '';
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{acc.description}</Typography>
            <Typography variant="caption" color="text.secondary">
              {acc.bankName} - Ag: {acc.agency} / Cc: {acc.accountNumber}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'typeId', headerName: 'Tipo', width: 100, align: 'center',
      renderCell: (val) => (
        <Chip
          icon={val === 1 ? <UpIcon /> : <DownIcon />}
          label={val === 1 ? 'Crédito' : 'Débito'}
          size="small"
          color={val === 1 ? 'info' : 'error'}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      )
    },
    {
      field: 'documentNumber', headerName: 'Nº Doc.', width: 120,
    },
    {
      field: 'value', headerName: 'Valor', width: 110, align: 'right',
      renderCell: (val, row) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700,
            color: row.typeId === 1 ? 'info.main' : 'error.main'
          }}
        >
          {val ? parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
        </Typography>
      )
    },
    {
      field: 'description', headerName: 'Descrição', flex: 1,
    },
    {
      field: 'isReconciled', headerName: 'Conc.', width: 80, align: 'center',
      renderCell: (val) => (
        val ? <CheckIcon color="success" fontSize="small" /> : null
      )
    }
  ];

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length]);

  const handleExport = async (format) => {
    loading.show('Gerando arquivo...', 'Aguarde um momento')
    try {
      await exporter.exportData({
        format,
        service: financeAction.findAllBankMovements,
        params: {
          range: rangeFilter.range,
          sortBy: table.sortBy,
          sortOrder: table.sortOrder
        },
        columns: table.orderedColumns,
        title: `Exportação de ${title}`
      })
    } finally {
      loading.hide()
    }
  };

  return (
    <Container>
      <Container.Title items={[{ label: 'Finanças' }, { label: title }]} />

      <Container.Content>
        <Toolbar
          primary={[
            // Potential actions like "Conciliar" could go here
            {
              label: 'Bancos',
              icon: <BankIcon />,
              variant: 'text',
              disabled: true
            }
          ]}
          secondary={[
            {
              label: rangeFilter.label,
              icon: <EventIcon fontSize="small" />,
              onClick: rangeFilter.handleOpen
            },
            {
              label: 'Pesquisar',
              icon: <SearchIcon fontSize="small" />,
              variant: 'outlined',
              color: 'primary',
              onClick: () => fetchTable(),
              options: [
                {
                  label: 'Exportar para Excel',
                  icon: <DownloadIcon fontSize="small" />,
                  onClick: () => handleExport(ExportFormat.EXCEL)
                },
                {
                  label: 'Exportar para Google Sheets',
                  icon: <GoogleIcon fontSize="small" />,
                  onClick: () => handleExport(ExportFormat.GOOGLE_SHEETS)
                }
              ]
            }
          ]}
        />

        <Table
          columns={table.orderedColumns.length > 0 ? table.orderedColumns : columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onSort={async (property) => {
            const isAsc = table.sortBy === property && table.sortOrder === 'ASC';
            const newOrder = isAsc ? 'DESC' : 'ASC';
            const ok = await fetchTable({ sortBy: property, sortOrder: newOrder, page: 1 });
            if (ok) {
              table.setSortOrder(newOrder);
              table.setSortBy(property);
              table.setPage(1);
            }
          }}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
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
        open={rangeFilter.open}
        onClose={rangeFilter.handleClose}
        title="Filtro de Período"
        initialField={rangeFilter.range.field}
        initialStart={rangeFilter.range.start}
        initialEnd={rangeFilter.range.end}
        fieldOptions={[
          { label: 'Data Real', value: 'realDate' },
          { label: 'Data de Lançamento', value: 'entryDate' },
        ]}
        onApply={async (vals) => {
          const ok = await fetchTable({ range: vals, page: 1 });
          if (ok) {
            rangeFilter.setRange(vals);
            rangeFilter.setOpen(false);
            table.setPage(1);
          }
        }}
      />
    </Container>
  );
}
