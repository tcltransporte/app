'use client';

import React from 'react';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useNavigation, useLoading, useRangeFilter, useExport } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { Button, IconButton, Tooltip, Box, Typography, Chip } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ListAlt as ListIcon,
  EditNote as EditNoteIcon,
  CalendarMonth as CalendarIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import FinanceTitleModal from './finance-title-modal';
import FinanceEntryModal from './finance-entry-modal';
import FinanceTitleDetailsDrawer from './finance-title-details-drawer';
import FinancePaymentHistoryDrawer from './finance-payment-history-drawer';
import EntryStatusChip from './finance-entry-status-chip';

export default function FinanceEntriesList({ operationType, title, initialTable, selectedId: propsSelectedId, initialRange }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const navigation = useNavigation(`/finances/${operationType === 1 ? 'receivements' : 'payments'}`, propsSelectedId);

  const rangeFilter = useRangeFilter({
    initialRange,
    dateFieldOptions: [
      { label: 'Data de Vencimento', value: 'dueDate' },
      { label: 'Data de Emissão', value: 'issueDate' },
    ]
  });
  const exporter = useExport();

  const [titleModalOpen, setTitleModalOpen] = React.useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = React.useState(false);
  const [selectedTitleId, setSelectedTitleId] = React.useState(null);
  const [selectedTitleDoc, setSelectedTitleDoc] = React.useState(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = React.useState(0);
  const [drawerOnTop, setDrawerOnTop] = React.useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = React.useState(false);
  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = React.useState(null);

  const handleEdit = React.useCallback((row) => {
    navigation.setSelectedId(row.id);
  }, [navigation]);

  const handleOpenDetails = React.useCallback((titleId, documentNumber, onTop = false) => {
    setSelectedTitleId(titleId);
    setSelectedTitleDoc(documentNumber);
    setDrawerOnTop(onTop);
    setDetailsDrawerOpen(true);
  }, []);

  const handleOpenHistory = React.useCallback((ids) => {
    setSelectedHistoryEntryId(ids);
    setHistoryDrawerOpen(true);
  }, []);

  const handleBaixar = React.useCallback(() => {
    const hasPaid = table.selecteds.some(s => s.status === 'paid');
    if (hasPaid) {
      alert.warning('Operação Inválida', 'Selecione apenas títulos em aberto para realizar a baixa.');
      return;
    }
    handleOpenHistory(table.selecteds.map(s => s.id));
  }, [table.selecteds, handleOpenHistory]);


  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeEntryAction.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        where: overrides.where || {},
        range: overrides.range || rangeFilter.range,
        operationType,
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
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, operationType, rangeFilter.range]);

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
    {
      field: 'documentNumber', headerName: 'Nº Doc.', width: 150,
      renderCell: (val, row) => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Typography
            sx={{
              fontSize: 'inherit', // Herda o tamanho da célula da tabela (0.8125rem)
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mr: 1
            }}
          >
            {row.title?.documentNumber || ''}
          </Typography>
          <Tooltip title="Ver todas as parcelas">
            <Chip
              label={`${row.installmentNumber}/${row.installmentsCount || '?'}`}
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails(row.titleId, row.title?.documentNumber);
              }}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                mr: 1, // Pequeno recuo
                boxShadow: (theme) => `0 2px 4px ${theme.palette.primary.main}44`,
                '&:hover': {
                  opacity: 0.9,
                  transform: 'scale(1.05)',
                  boxShadow: (theme) => `0 4px 8px ${theme.palette.primary.main}66`,
                },
                transition: 'all 0.2s'
              }}
            />
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'partner', headerName: 'Fornecedor/Cliente',
      renderCell: (val, row) => row.title?.partner?.surname || row.title?.partner?.name || ''
    },
    {
      field: 'description', headerName: 'Descrição', width: 240,
      renderCell: (val, row) => row.description || row.title?.description || ''
    },
    {
      field: 'accountPlan', headerName: 'Plano de Contas', width: 240,
      renderCell: (val, row) => row.title?.accountPlan ? `${row.title.accountPlan.code} - ${row.title.accountPlan.description}` : ''
    },
    {
      field: 'costCenter', headerName: 'Centro de Custo', width: 180,
      renderCell: (val, row) => row.title?.costCenter ? row.title.costCenter.description : ''
    },
    {
      field: 'status', headerName: 'Status', width: 90, align: 'center',
      renderCell: (val, row) => (
        <Tooltip title="Ver rastro de pagamento">
          <span>
            <EntryStatusChip
              entry={row}
              operationType={operationType}
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 20,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenHistory([row.id]);
              }}
            />
          </span>
        </Tooltip>
      )
    },
    {
      field: 'dueDate', headerName: 'Vencimento', width: 120, align: 'center',
      renderCell: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : ''
    },
    {
      field: 'installmentValue', headerName: 'Valor', width: 90, align: 'right',
      renderCell: (value) => value ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'
    },
    /*{
      field: 'actions', headerName: 'Ações', width: 80, align: 'center',
      renderCell: (val, row) => (
        <Tooltip title="Editar Parcela">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedEntryId(row.id);
              setEntryModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },*/
  ];

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length]);

  const handleExport = async (format) => {
    loading.show('Gerando arquivo...', 'Isso pode levar alguns segundos dependendo da quantidade de dados.')
    try {
      await exporter.exportData({
        format,
        service: financeEntryAction.findAll,
        params: {
          operationType,
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
            {
              label: 'Adicionar',
              icon: <AddIcon />,
              onClick: () => setTitleModalOpen(true),
              variant: 'contained'
            },
            ...(table.selecteds.length === 1 ? [{
              label: 'Editar',
              icon: <EditNoteIcon />,
              onClick: () => handleEdit(table.selecteds[0]),
              variant: 'outlined',
              color: 'primary'
            }] : []),
            ...(table.selecteds.length > 0 ? [{
              label: `Baixar${table.selecteds.length > 1 ? ` (${table.selecteds.length})` : ''}`,
              icon: <CheckIcon />,
              onClick: handleBaixar,
              variant: 'contained',
              color: 'success'
            }] : [])

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
          onRowDoubleClick={handleEdit}
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

      <FinanceTitleModal
        open={titleModalOpen}
        onClose={() => setTitleModalOpen(false)}
        operationType={operationType}
        onSuccess={() => fetchTable()}
      />

      <FinanceEntryModal
        open={!!navigation.selectedId}
        onClose={() => navigation.setSelectedId(undefined)}
        entryId={navigation.selectedId}
        onSuccess={() => {
          fetchTable();
          setDrawerRefreshKey(prev => prev + 1);
        }}
        onViewEntries={(titleId, docNumber) => {
          handleOpenDetails(titleId, docNumber, true);
        }}
      />

      <FinanceTitleDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        titleId={selectedTitleId}
        documentNumber={selectedTitleDoc}
        onEditEntry={(entryId) => {
          setDetailsDrawerOpen(false);
          navigation.setSelectedId(entryId);
        }}
        refreshKey={drawerRefreshKey}
        onTop={drawerOnTop}
        operationType={operationType}
      />

      <FinancePaymentHistoryDrawer
        open={historyDrawerOpen}
        entryIds={selectedHistoryEntryId}
        onClose={() => setHistoryDrawerOpen(false)}
        onSuccess={() => fetchTable()}
        operationType={operationType}
      />

      <RangeModal
        open={rangeFilter.open}
        onClose={rangeFilter.handleClose}
        title="Filtro de Período"
        initialField={rangeFilter.range.field}
        initialStart={rangeFilter.range.start}
        initialEnd={rangeFilter.range.end}
        fieldOptions={[
          { label: 'Data de Vencimento', value: 'dueDate' },
          { label: 'Data de Emissão', value: 'issueDate' },
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
