'use client';

import React from 'react';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useNavigation, useLoading, useRangeFilter, useExport, useFilter } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { formatSqlDate } from '@/libs/date';
import { Button, IconButton, Box, Typography, Badge, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
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
  CheckCircle as CheckIcon,
  Undo as UndoIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import FinanceTitleModal from './finance-title-modal';
import FinanceEntryModal from './finance-entry-modal';
import FinanceTitleDetailsDrawer from './finance-title-details-drawer';
import FinancePaymentHistoryDrawer from './finance-payment-history-drawer';
import EntryStatusChip from './finance-entry-status-chip';
import FinanceEntriesFilter from './finance-entries-filter';
import UnifiedChip from '@/components/common/UnifiedChip';

export default function FinanceEntriesList({ operationType, title, initialTable, selectedId: propsSelectedId, initialRange, initialFilters = {} }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const navigation = useNavigation(`/finances/${operationType === 1 ? 'receivements' : 'payments'}`, propsSelectedId);
  const filter = useFilter({ initialFilters });

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
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const [actionMenuRow, setActionMenuRow] = React.useState(null);
  const [actionMenuPosition, setActionMenuPosition] = React.useState(null);

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

  const handleOpenActionMenu = React.useCallback((event, row) => {
    event.stopPropagation();
    const anchor = event.currentTarget;
    const rect = anchor.getBoundingClientRect();
    const rawZoom = Number(window.getComputedStyle(document.body).getPropertyValue('--app-zoom'));
    const zoom = Number.isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1;

    setActionMenuAnchor(anchor);
    setActionMenuRow(row);
    setActionMenuPosition({
      top: rect.bottom / zoom,
      left: rect.right / zoom
    });
  }, []);

  const handleCloseActionMenu = React.useCallback(() => {
    setActionMenuAnchor(null);
    setActionMenuRow(null);
    setActionMenuPosition(null);
  }, []);

  const handleBaixar = React.useCallback(() => {
    const hasPaid = table.selecteds.some(s => s.status === 'paid');
    if (hasPaid) {
      alert.warning('Operação Inválida', 'Selecione apenas títulos em aberto para realizar a baixa.');
      return;
    }
    handleOpenHistory(table.selecteds.map(s => s.id));
  }, [table.selecteds, handleOpenHistory]);

  const isPaidEntry = React.useCallback((entry) => {
    return entry?.status === 'paid'
      || entry?.displayStatus === 'paid'
      || Number(entry?.paymentId) > 0
      || Number(entry?.codigo_pagamento) > 0;
  }, []);

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const result = await financeEntryAction.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        filters: overrides.filters || filter.filters,
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
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, operationType, rangeFilter.range, filter.filters]);

  const handleDesfazerLote = React.useCallback(async () => {
    if (table.selecteds.length === 0) return;

    const hasOpenEntries = table.selecteds.some((entry) => !isPaidEntry(entry));
    if (hasOpenEntries) {
      alert.warning('Operação Inválida', 'Selecione apenas títulos já baixados para desfazer em lote.');
      return;
    }

    const verb = operationType === 1 ? 'recebimento' : 'pagamento';
    const ok = await alert.confirm(
      `Desfazer ${verb} em lote?`,
      'Essa ação remove os lançamentos de extrato da baixa, exclui os pagamentos e reabre as parcelas selecionadas.',
      'warning'
    );
    if (!ok) return;

    loading.show('Desfazendo baixa...', 'Aguarde alguns instantes.')
    try {
      const ids = table.selecteds.map((entry) => entry.id).filter(Boolean);
      const result = await financeAction.reverseSettlementsFromEntries(ids);
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      alert.success('Sucesso', 'Baixa em lote desfeita com sucesso!');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível desfazer', error?.body?.message || error.message);
    } finally {
      loading.hide();
    }
  }, [table.selecteds, isPaidEntry, operationType, fetchTable, loading]);

  const handleDeleteEntry = React.useCallback(async (row) => {
    if (!row) return;

    if (isPaidEntry(row)) {
      alert.warning('Operação Inválida', 'Só é possível excluir parcelas que ainda não foram baixadas.');
      return;
    }

    const ok = await alert.confirm(
      'Excluir parcela?',
      'Essa ação não poderá ser desfeita.',
      'warning'
    );
    if (!ok) return;

    loading.show('Excluindo parcela...', 'Aguarde alguns instantes.');
    try {
      const result = await financeEntryAction.deleteEntry(row.id);
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      alert.success('Sucesso', 'Parcela excluída com sucesso!');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível excluir', error?.body?.message || error.message);
    } finally {
      loading.hide();
    }
  }, [isPaidEntry, fetchTable, loading]);

  const columns = [
    {
      field: 'documentNumber', headerName: 'Nº Doc.', width: 140,
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
          <span title="Ver todas as parcelas">
            <UnifiedChip
              label={`${row.installmentNumber}/${row.installmentsCount || '?'}`}
              color="primary"
              variant="filled"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails(row.titleId, row.title?.documentNumber);
              }}
              chipSx={{
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
          </span>
        </Box>
      )
    },
    {
      field: 'partner', headerName: 'Fornecedor/Cliente', width: 200,
      renderCell: (val, row) => row.title?.partner?.surname || row.title?.partner?.name || ''
    },
    {
      field: 'description', headerName: 'Descrição', width: 'auto',
      renderCell: (val, row) => row.description || row.title?.description || ''
    },
    {
      field: 'accountPlan', headerName: 'Plano de Contas', width: 220,
      renderCell: (val, row) => row.title?.accountPlan ? `${row.title.accountPlan.code} - ${row.title.accountPlan.description}` : ''
    },
    {
      field: 'costCenter', headerName: 'Centro de Custo', width: 160,
      renderCell: (val, row) => row.title?.costCenter ? row.title.costCenter.description : ''
    },
    {
      field: 'status', headerName: 'Status', width: 90, align: 'center',
      renderCell: (val, row) => (
        <span title={(row?.displayStatus ?? row?.status) === 'pending_recon' ? 'Pendente de conciliação' : 'Ver rastro de pagamento'}>
          <EntryStatusChip
            entry={row}
            operationType={operationType}
            sx={{
              fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
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
      )
    },
    {
      field: 'dueDate', headerName: 'Vencimento', width: 110, align: 'center',
      renderCell: (value) => formatSqlDate(value)
    },
    {
      field: 'paymentRealDate',
      headerName: operationType === 1 ? 'Recebimento' : 'Pagamento',
      width: 110,
      align: 'center',
      renderCell: (value) => value ? formatSqlDate(value) : '-'
    },
    {
      field: 'installmentValue', headerName: 'Valor', width: 80, align: 'right',
      renderCell: (value) => value ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'
    },
    {
      field: 'actions', headerName: '', width: 50, align: 'center', sortable: false,
      renderCell: (val, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleOpenActionMenu(e, row)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    },
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
          filters: filter.filters,
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
            }] : []),
            ...(table.selecteds.length > 0 ? [{
              label: `Desfazer${table.selecteds.length > 1 ? ` (${table.selecteds.length})` : ''}`,
              icon: <UndoIcon />,
              onClick: handleDesfazerLote,
              variant: 'outlined',
              color: 'warning'
            }] : [])

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

      <FinanceEntriesFilter
        open={filter.open}
        operationType={operationType}
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

      <Menu
        anchorEl={actionMenuAnchor}
        anchorReference="anchorPosition"
        anchorPosition={actionMenuPosition || undefined}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
              mt: 1.25,
              minWidth: 180,
              borderRadius: 2,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          const row = actionMenuRow;
          handleCloseActionMenu();
          if (row) handleEdit(row);
        }}>
          <ListItemIcon><EditNoteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={isPaidEntry(actionMenuRow)}
          onClick={() => {
          const row = actionMenuRow;
          handleCloseActionMenu();
          if (!row) return;
          handleOpenHistory([row.id]);
        }}>
          <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Baixar</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!isPaidEntry(actionMenuRow)}
          onClick={() => {
          const row = actionMenuRow;
          handleCloseActionMenu();
          if (!row) return;
          handleOpenHistory([row.id]);
        }}>
          <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Desfazer</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={isPaidEntry(actionMenuRow)}
          onClick={() => {
          const row = actionMenuRow;
          handleCloseActionMenu();
          if (row) handleDeleteEntry(row);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Container>
  );
}
