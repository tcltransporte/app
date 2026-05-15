'use client';

import React from 'react';
import { Badge, IconButton } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  EditNote as EditNoteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Container, Table, Toolbar, RangeModal, ActionMenu } from '@/components/common';
import UnifiedChip from '@/components/common/UnifiedChip';
import { useTable, useFilter, useRangeFilter } from '@/hooks';
import * as shipmentAction from '@/app/actions/shipment.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { formatSqlDate } from '@/libs/date';
import ShipmentFilter from './shipment-filter';
import ShipmentFormModal from './shipment-form-modal';
import ShipmentCtesDrawer from './shipment-ctes-drawer';

function partnerLabel(partner) {
  if (!partner) return '';
  const label = String(partner.surname || partner.name || '').trim();
  if (label) return label;
  return String(partner.cpfCnpj || '').trim();
}

export default function ShipmentList({
  title,
  initialTable,
  initialFilters,
  initialRange,
  companyId
}) {
  const table = useTable({ initialTable });
  const filter = useFilter({ initialFilters });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [ctesDrawer, setCtesDrawer] = React.useState({ open: false, shipmentId: null, label: '' });
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const [actionMenuRow, setActionMenuRow] = React.useState(null);

  const handleOpenCreate = React.useCallback(() => {
    setEditingId(null);
    setFormOpen(true);
  }, []);

  const handleEdit = React.useCallback((row) => {
    if (!row?.id) return;
    setEditingId(row.id);
    setFormOpen(true);
  }, []);

  const handleCloseForm = React.useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
  }, []);

  const handleOpenCtesDrawer = React.useCallback((row) => {
    if (!row?.id) return;
    const label = row.transportDocumentId
      ? `Doc. ${row.transportDocumentId}`
      : String(row.id);
    setCtesDrawer({ open: true, shipmentId: row.id, label });
  }, []);

  const handleCloseCtesDrawer = React.useCallback(() => {
    setCtesDrawer({ open: false, shipmentId: null, label: '' });
  }, []);

  const handleOpenActionMenu = React.useCallback((event, row) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setActionMenuRow(row);
  }, []);

  const handleCloseActionMenu = React.useCallback(() => {
    setActionMenuAnchor(null);
    setActionMenuRow(null);
  }, []);

  const rangeFilter = useRangeFilter({
    initialRange: initialRange || { start: '', end: '', field: 'departureDate' },
    dateFieldOptions: [
      { label: 'Data de saída', value: 'departureDate' },
      { label: 'Data de entrega', value: 'deliveryDate' }
    ],
    defaultLabel: 'Todo o período'
  });

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
      const result = await shipmentAction.findAll({
        page: overrides.page !== undefined ? overrides.page : q.page,
        limit: overrides.rowsPerPage !== undefined ? overrides.rowsPerPage : q.rowsPerPage,
        sortBy: overrides.sortBy !== undefined ? overrides.sortBy : (q.sortBy || 'id'),
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
      field: 'departureDate',
      headerName: 'Saída',
      width: 110,
      align: 'center',
      renderCell: (value) => formatSqlDate(value) || ''
    },
    {
      field: 'deliveryDate',
      headerName: 'Entrega',
      width: 110,
      align: 'center',
      renderCell: (value) => formatSqlDate(value) || ''
    },
    {
      field: 'transportDocumentId',
      headerName: 'Nº Doc',
      width: 100
    },
    {
      field: 'customer',
      headerName: 'Remetente',
      width: 220,
      renderCell: (_, row) => partnerLabel(row?.customer)
    },
    /*{
      field: 'receiver',
      headerName: 'Recebedor',
      width: 200,
      renderCell: (_, row) => partnerLabel(row?.receiver)
    },*/
    {
      field: 'description',
      headerName: 'Descrição',
      width: 'auto',
      renderCell: (value, row) => String(value || row?.proPred || '').trim()
    },
    {
      field: 'weight',
      headerName: 'Peso',
      width: 100,
      align: 'right',
      renderCell: (value) => value != null
        ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    },
    {
      field: 'freightValue',
      headerName: 'Frete',
      width: 120,
      align: 'right',
      renderCell: (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      field: 'ctesCount',
      headerName: 'CT-es',
      width: 88,
      align: 'center',
      sortable: false,
      renderCell: (value, row) => {
        const count = Number(value) || 0;
        return (
          <span title="Ver CT-es da carga">
            <UnifiedChip
              label={String(count)}
              color={count > 0 ? 'primary' : 'default'}
              variant="filled"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCtesDrawer(row);
              }}
              chipSx={{
                cursor: 'pointer',
                minWidth: 32,
                boxShadow: (theme) =>
                  count > 0 ? `0 2px 4px ${theme.palette.primary.main}44` : 'none',
                '&:hover': {
                  opacity: 0.9,
                  transform: 'scale(1.05)',
                  boxShadow: (theme) =>
                    count > 0 ? `0 4px 8px ${theme.palette.primary.main}66` : undefined
                },
                transition: 'all 0.2s'
              }}
            />
          </span>
        );
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      align: 'center',
      sortable: false,
      renderCell: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleOpenActionMenu(e, row)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    }
  ]), [handleOpenCtesDrawer, handleOpenActionMenu]);

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
              onClick: handleOpenCreate
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
          onRowDoubleClick={handleEdit}
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
        title="Período"
        initialField={rangeFilter.range.field}
        initialStart={rangeFilter.range.start}
        initialEnd={rangeFilter.range.end}
        fieldOptions={[
          { label: 'Data de saída', value: 'departureDate' },
          { label: 'Data de entrega', value: 'deliveryDate' }
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

      <ShipmentFilter
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

      <ShipmentFormModal
        open={formOpen}
        shipmentId={editingId}
        onClose={handleCloseForm}
        onSuccess={() => fetchTable()}
      />

      <ShipmentCtesDrawer
        open={ctesDrawer.open}
        shipmentId={ctesDrawer.shipmentId}
        shipmentLabel={ctesDrawer.label}
        onClose={handleCloseCtesDrawer}
        onCtesChanged={() => fetchTable()}
      />

      <ActionMenu
        open={Boolean(actionMenuAnchor)}
        anchorEl={actionMenuAnchor}
        onClose={handleCloseActionMenu}
        placement="bottom-end"
        zoomAwareVertical
        items={[
          {
            id: 'edit',
            label: 'Editar',
            icon: <EditNoteIcon fontSize="small" />,
            onClick: () => actionMenuRow && handleEdit(actionMenuRow)
          },
          {
            id: 'ctes',
            label: `Ver CT-es (${Number(actionMenuRow?.ctesCount) || 0})`,
            icon: <DescriptionIcon fontSize="small" />,
            onClick: () => actionMenuRow && handleOpenCtesDrawer(actionMenuRow)
          }
        ]}
      />
    </Container>
  );
}
