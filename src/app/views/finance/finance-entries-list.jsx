'use client';

import React from 'react';
import { Container, Table, Toolbar } from '@/components/common';
import { useTable, useNavigation, useLoading } from '@/hooks';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export default function FinanceEntriesList({ operationType, title, initialTable }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const navigation = useNavigation(`/finance/${operationType === 1 ? 'payable' : 'receivable'}`);

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeEntryAction.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        where: overrides.where || {}, // Add extra filtering if needed
        include: [
          {
            association: 'title',
            where: { operationType },
            include: ['partner']
          }
        ],
        sortBy: overrides.sortBy || table.sortBy || undefined,
        sortOrder: overrides.sortOrder || table.sortOrder || undefined
      });

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      table.setItems(result.body.items || result.body.rows || []);
      table.setTotal(result.body.total || result.body.count || 0);
      table.setSelecteds([]);
      return true;

    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message);
      return false;
    } finally {
      table.setLoading(false);
      loading.hide();
    }
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, operationType]);

  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Only fetch automatically if filters/page change and it is not the first SSR render
    fetchTable();
  }, [fetchTable]);

  const columns = [
    { field: 'id', headerName: 'Cód. Parcela', width: 120 },
    { field: 'installmentNumber', headerName: 'Nº Parcela', width: 100 },
    {
      field: 'partner', headerName: 'Fornecedor/Cliente', width: 300,
      renderCell: (val, row) => row.title?.partner?.surname || row.title?.partner?.name || ''
    },
    {
      field: 'dueDate', headerName: 'Vencimento', width: 150,
      renderCell: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : ''
    },
    {
      field: 'installmentValue', headerName: 'Valor', width: 150,
      renderCell: (value) => value ? parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''
    },
    {
      field: 'documentNumber', headerName: 'Nº Doc', width: 150,
      renderCell: (val, row) => row.title?.documentNumber || ''
    }
  ];

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length]);

  return (
    <Container>
      <Container.Title items={[{ label: 'Finanças' }, { label: title }]} />

      <Container.Content>
        <Toolbar
          primary={[]}
          secondary={[]}
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
    </Container>
  );
}
