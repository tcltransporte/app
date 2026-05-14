'use client';

import React from 'react';
import { Badge } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useFilter, useRangeFilter } from '@/hooks';
import * as cteAction from '@/app/actions/cte.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import KnowledgeFilter from './knowledge-filter';
import KnowledgeUploadDrawer from './knowledge-upload-drawer';

export default function KnowledgeList({
  title,
  initialTable,
  initialFilters,
  initialRange,
  companyId
}) {
  const table = useTable({ initialTable });
  const filter = useFilter({ initialFilters });
  const rangeFilter = useRangeFilter({
    initialRange: initialRange || { start: '', end: '', field: 'issuedAt' },
    dateFieldOptions: [],
    defaultLabel: 'Todo o período'
  });
  const [uploadOpen, setUploadOpen] = React.useState(false);

  /** Evita recriar `fetchTable` quando filtros/período mudam só na hidratação (disparava fetch duplicado). */
  const filtersRef = React.useRef(filter.filters);
  filtersRef.current = filter.filters;
  const rangeRef = React.useRef(rangeFilter.range);
  rangeRef.current = rangeFilter.range;
  const tableQueryRef = React.useRef({
    page: table.page,
    rowsPerPage: table.rowsPerPage,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder
  });
  tableQueryRef.current = {
    page: table.page,
    rowsPerPage: table.rowsPerPage,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder
  };

  const fetchTable = React.useCallback(async (overrides = {}) => {
    const q = tableQueryRef.current;
    table.setLoading(true);
    try {
      const result = await cteAction.findAll({
        page: overrides.page !== undefined ? overrides.page : q.page,
        limit: overrides.rowsPerPage !== undefined ? overrides.rowsPerPage : q.rowsPerPage,
        sortBy: overrides.sortBy !== undefined ? overrides.sortBy : (q.sortBy || 'issuedAt'),
        sortOrder: overrides.sortOrder !== undefined ? overrides.sortOrder : (q.sortOrder || 'DESC'),
        filters: overrides.filters !== undefined ? overrides.filters : filtersRef.current,
        range: overrides.range !== undefined ? overrides.range : rangeRef.current,
        companyId,
      });

      if (result?.header?.status !== ServiceStatus.SUCCESS) {
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
    }
  }, [companyId, table.setItems, table.setTotal, table.setSelecteds, table.setLoading]);

  /** Dados iniciais vêm do SSR (`initialTable`); só busca de novo ao mudar página, itens por página ou ordenação. */
  const skipAutoFetchOnce = React.useRef(true);
  React.useEffect(() => {
    if (skipAutoFetchOnce.current) {
      skipAutoFetchOnce.current = false;
      return;
    }
    fetchTable();
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, companyId, fetchTable]);

  const columns = React.useMemo(() => ([
    {
      field: 'issuedAt',
      headerName: 'Emissão',
      width: 145,
      align: 'center',
      renderCell: (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const parts = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).formatToParts(d);
        const m = Object.fromEntries(
          parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
        );
        return `${m.day}/${m.month}/${m.year} ${m.hour}:${m.minute}`;
      }
    },
    {
      field: 'ctNumber',
      headerName: 'CT-e',
      width: 80,
      align: 'right'
    },
    {
      field: 'ctSeries',
      headerName: 'Série',
      width: 70,
      align: 'right'
    },
    {
      field: 'ctKey',
      headerName: 'Chave',
      width: 340,
      headerSx: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        fontWeight: 700
      },
      sx: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums'
      }
    },
    {
      field: 'remetenteFromXml',
      headerName: 'Remetente',
      width: 240,
      renderCell: (_, row) => String(row?.remetenteFromXml || '').trim()
    },
    {
      field: 'destinatarioFromXml',
      headerName: 'Destinatário',
      width: 240,
      renderCell: (_, row) => {
        const fromXml = String(row?.destinatarioFromXml || '').trim();
        if (fromXml) return fromXml;
        const p = row?.destinatario;
        if (!p) return '';
        const label = String(p.surname || p.name || '').trim();
        if (label) return label;
        return String(p.cpfCnpj || '').trim();
      }
    },
    {
      field: 'amountToReceive',
      headerName: 'A Receber',
      width: 130,
      align: 'right',
      renderCell: (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      field: 'statusCode',
      headerName: 'Status',
      width: 90,
      align: 'center'
    }
  ]), []);

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [columns, table]);

  return (
    <Container>
      <Container.Title items={[{ label: 'Logística' }, { label: title }]} />

      <Container.Content>
        <Toolbar
          primary={[
            {
              label: 'Adicionar',
              icon: <AddIcon fontSize="small" />,
              onClick: () => {
                alert.info(
                  'Adicionar CT-e',
                  'O cadastro manual será disponibilizado em breve. Utilize Importar XML para enviar os arquivos do CT-e.'
                );
              }
            },
            {
              label: 'Importar',
              icon: <CloudUploadIcon fontSize="small" />,
              onClick: () => setUploadOpen(true)
            }
          ]}
          secondary={[
            {
              label: rangeFilter.label,
              icon: <EventIcon fontSize="small" />,
              onClick: rangeFilter.handleOpen
            },
            {
              label: 'Filtros',
              icon: (
                <Badge badgeContent={filter.activeCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, top: 2, right: 2 } }}>
                  <FilterIcon fontSize="small" />
                </Badge>
              ),
              onClick: filter.handleOpen
            },
            {
              label: 'Pesquisar',
              icon: <SearchIcon fontSize="small" />,
              variant: 'outlined',
              color: 'primary',
              onClick: () => {
                table.setPage(1);
                fetchTable({ page: 1 });
              }
            }
          ]}
        />

        <Table
          columns={table.orderedColumns.length > 0 ? table.orderedColumns : columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onSort={(property) => {
            const isAsc = table.sortBy === property && table.sortOrder === 'ASC';
            const newOrder = isAsc ? 'DESC' : 'ASC';
            table.setSortOrder(newOrder);
            table.setSortBy(property);
            table.setPage(1);
          }}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onColumnsReorder={table.setOrderedColumns}
          widths={table.columnWidths}
          onResize={table.handleColumnResize}
          loading={table.loading}
          containerSx={{ minHeight: 0 }}
          fixed
        />
      </Container.Content>

      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        selectedCount={table.selecteds.length}
        onPageChange={(e, p) => table.setPage(p)}
        onRowsPerPageChange={(e) => {
          table.setRowsPerPage(Number(e.target.value));
          table.setPage(1);
        }}
      />

      <RangeModal
        open={rangeFilter.open}
        onClose={rangeFilter.handleClose}
        title="Data de emissão"
        initialField={rangeFilter.range.field}
        initialStart={rangeFilter.range.start}
        initialEnd={rangeFilter.range.end}
        onApply={async (vals) => {
          const ok = await fetchTable({ range: vals, page: 1 });
          if (ok) {
            rangeFilter.setRange(vals);
            rangeFilter.setOpen(false);
            table.setPage(1);
          }
        }}
      />

      <KnowledgeFilter
        open={filter.open}
        filters={filter.filters}
        onClose={filter.handleClose}
        onApply={async (vals) => {
          const ok = await fetchTable({ filters: vals, page: 1 });
          if (ok) {
            filter.setFilters(vals);
            filter.setOpen(false);
            table.setPage(1);
          }
        }}
      />

      <KnowledgeUploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={() => fetchTable({ page: 1 })}
      />
    </Container>
  );
}
