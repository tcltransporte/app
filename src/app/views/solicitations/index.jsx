'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, IconButton as MuiIconButton, Tooltip, Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  Autorenew as StatusIcon,
  MoreVert as MoreIcon,
  NoteAdd as GenerateIcon,
  Description as DocumentIcon,
  LocalShipping as FreightIcon,
} from '@mui/icons-material';

import SolicitationDetail from './solicitation.detail';
import SolicitationFilter from './filter';
import { StatusDrawer } from './status-drawer';
import { GenerateDocumentDrawer } from './generate-document-drawer';
import { SolicitationDocumentViewerDrawer } from './document-viewer-drawer';
import { GenerateFreightLetterDrawer } from './generate-freightletter-drawer';
import { useTable, useNavigation, useRangeFilter, useFilter, useExport, useLoading } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import * as solicitationAction from '@/app/actions/solicitation.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export default function SolicitationView({
  initialTable,
  initialFilters,
  initialRange,
  dateFieldOptions = [],
  solicitationType,
  selectedId
}) {
  const RowActions = ({ row }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const openMenu = Boolean(anchorEl);

    const handleClick = (event) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleClose = (e) => {
      if (e) e.stopPropagation();
      setAnchorEl(null);
    };

    const handleGenerateDocument = (e) => {
      e.stopPropagation();
      handleClose();
      setGenerateDocumentDrawer({ open: true, solicitations: [row] });
    };

    const hasGenerate = !!row.status?.generateDocumentTypeId;
    const count = row.documents?.length || 0;
    const hasActions = hasGenerate; // Only action currently is Generate

    return (
      <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
        <Tooltip title="Ver documentos">
          <MuiIconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (count > 0) setDocumentViewerDrawer({ open: true, solicitation: row });
            }}
            disabled={count === 0}
            sx={{
              width: 24,
              height: 24,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: count > 0 ? 'primary.main' : 'action.disabledBackground',
              color: count > 0 ? 'primary.contrastText' : 'text.disabled',
              '&:hover': {
                bgcolor: count > 0 ? 'primary.dark' : 'action.disabledBackground',
              },
              '&.Mui-disabled': {
                bgcolor: 'transparent',
                color: 'text.disabled',
                border: '1px solid',
                borderColor: 'divider',
              }
            }}
          >
            {count}
          </MuiIconButton>
        </Tooltip>

        {hasActions && (
          <>
            <Tooltip title="Ações">
              <MuiIconButton size="small" onClick={handleClick}>
                <MoreIcon fontSize="small" />
              </MuiIconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {hasGenerate && (
                <MenuItem
                  onClick={handleGenerateDocument}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 'auto !important' }}>
                    <GenerateIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Gerar documento" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
              )}
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                  setGenerateFreightLetterDrawer({ open: true, solicitations: [row] });
                }}
                sx={{ gap: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 'auto !important' }}>
                  <FreightIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Gerar carta frete" primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    );
  };

  const navigation = useNavigation(`/solicitations/${solicitationType?.hash}`, selectedId)
  const searchParams = useSearchParams();
  const tripTravelId = searchParams.get('tripTravelId');

  const [statusDrawer, setStatusDrawer] = React.useState({ open: false, selectedIds: [], fromStatusIds: [] });
  const [generateDocumentDrawer, setGenerateDocumentDrawer] = React.useState({ open: false, solicitations: [] });
  const [generateFreightLetterDrawer, setGenerateFreightLetterDrawer] = React.useState({ open: false, solicitations: [] });
  const [documentViewerDrawer, setDocumentViewerDrawer] = React.useState({ open: false, solicitation: null });

  const table = useTable({ initialTable })
  const filter = useFilter({ initialFilters })
  const rangeFilter = useRangeFilter({ initialRange, dateFieldOptions })
  const exporter = useExport()
  const loading = useLoading()

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.id)
  const handleCloseModal = () => navigation.setSelectedId(undefined)

  const handleSave = () => {
    fetchTable()
    handleCloseModal()
  }

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true)
    try {
      const result = await solicitationAction.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        filters: overrides.filters || filter.filters,
        range: overrides.range || rangeFilter.range,
        sortBy: overrides.sortBy || table.sortBy || undefined,
        sortOrder: overrides.sortOrder || table.sortOrder || undefined
      })

      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      table.setItems(result.body.items || [])
      table.setTotal(result.body.total || 0)
      table.setSelecteds([])
      return true

    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
      return false
    } finally {
      table.setLoading(false)
      loading.hide()
    }
  }, [table.page, table.rowsPerPage, filter.filters, rangeFilter.range, table.sortBy, table.sortOrder])

  const isFirstMount = React.useRef(true)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // Auto-fetch removed to avoid unwanted triggers on route change
  }, [])

  React.useEffect(() => {
    filter.setFilters(prev => {
      if (prev.typeHash === solicitationType?.hash) return prev;
      return { ...prev, typeHash: solicitationType?.hash };
    });
    table.setPage(prev => (prev === 1 ? prev : 1));
  }, [solicitationType?.hash])

  const handleDelete = async () => {
    if (!table.selecteds.length) return
    const confirmed = await alert.confirm(
      'Tem certeza?',
      `Deseja realmente excluir ${table.selecteds.length} solicitação(ões)?`,
      'warning'
    )
    if (!confirmed) return
    loading.show('Excluindo...', 'Aguarde um momento')
    try {
      for (const item of table.selecteds) {
        await solicitationAction.destroy(item.id)
      }
      await fetchTable()
      alert.success('Solicitação(ões) excluída(s) com sucesso!')
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  };

  const handleExport = async (format) => {
    loading.show('Gerando arquivo...', 'Isso pode levar alguns segundos dependendo da quantidade de dados.')
    try {
      await exporter.exportData({
        format,
        service: solicitationAction.findAll,
        params: {
          typeHash: solicitationType?.hash,
          filters: filter.filters,
          range: rangeFilter.range,
          sortBy: table.sortBy,
          sortOrder: table.sortOrder
        },
        columns: table.orderedColumns,
        title: `Exportação de ${solicitationType?.description || 'Solicitações'}`
      })
    } finally {
      loading.hide()
    }
  };

  const columns = [
    { field: 'number', headerName: 'Número', width: 100 },
    {
      field: 'partnerId', headerName: 'Fornecedor',
      renderCell: (val, row) => row.partner?.surname || row.partner?.name || ''
    },
    { field: 'description', headerName: 'Descrição', fontWeight: 200 },
    {
      field: 'date', headerName: 'Data', width: 200,
      renderCell: (value) => value ? new Date(value).toLocaleString() : ''
    },
    {
      field: 'payments', headerName: 'Valor', width: 140,
      renderCell: (value, row) => {
        const total = (row.payments || []).reduce((sum, p) => sum + parseFloat(p.value || 0), 0);
        return total > 0
          ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '';
      }
    },
    {
      field: 'statusId', headerName: 'Status', width: 200,
      sx: { py: 0 },
      renderCell: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 32 }}>
          <Typography variant="body2" sx={{ lineHeight: 1 }}>{row.status?.description || 'Pendente'}</Typography>
          <Tooltip title="Alterar status">
            <MuiIconButton
              size="small"
              sx={{ p: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setStatusDrawer({ open: true, selectedIds: [row.id], fromStatusIds: [row.statusId] });
              }}
            >
              <StatusIcon sx={{ fontSize: 18 }} />
            </MuiIconButton>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      sx: { py: 0 },
      renderCell: (val, row) => <RowActions row={row} />
    }
  ]

  // Initialize columns in hook if not already done
  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns)
    }
  }, [table.orderedColumns.length])

  const displayColumns = columns;

  const primaryActions = [
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => navigation.setSelectedId('new') },
    ...(table.selecteds.length === 1 ? [
      { label: 'Editar', icon: <EditIcon />, variant: 'outlined', color: 'primary', onClick: () => navigation.setSelectedId(table.selecteds[0].id) },
    ] : []),
    ...(table.selecteds.length > 0 ? [
      {
        label: 'Alterar Status',
        icon: <StatusIcon />,
        variant: 'outlined',
        color: 'primary',
        onClick: () => setStatusDrawer({
          open: true,
          selectedIds: table.selecteds.map(s => s.id),
          fromStatusIds: table.selecteds.map(s => s.statusId)
        })
      },
    ] : []),
    ...(table.selecteds.some(s => !!s.status?.generateDocumentTypeId) ? [
      {
        label: 'Gerar documentos',
        icon: <GenerateIcon />,
        variant: 'outlined',
        color: 'primary',
        onClick: () => setGenerateDocumentDrawer({
          open: true,
          solicitations: table.selecteds.filter(s => !!s.status?.generateDocumentTypeId)
        })
      },
    ] : []),
    ...(table.selecteds.length > 0 ? [
      {
        label: 'Gerar cartas frete',
        icon: <FreightIcon />,
        variant: 'outlined',
        color: 'primary',
        onClick: () => setGenerateFreightLetterDrawer({
          open: true,
          solicitations: table.selecteds
        })
      },
    ] : []),

    ...(table.selecteds.length > 0 ? [
      { label: 'Excluir', icon: <DeleteIcon />, variant: 'outlined', color: 'error', onClick: handleDelete },
    ] : []),
  ]

  const secondaryActions = [
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
  ];

  return (
    <Container>

      <Container.Title items={[{ label: 'Solicitações' }, { label: solicitationType?.description || 'Todas' }]} />

      <Container.Content>

        <Toolbar
          primary={primaryActions}
          secondary={secondaryActions}
        />



        <Table
          columns={displayColumns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onRowDoubleClick={handleRowDoubleClick}
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

        <SolicitationDetail
          solicitationId={navigation.selectedId}
          onClose={handleCloseModal}
          onSave={handleSave}
          solicitationType={solicitationType}
          tripTravelId={tripTravelId}
        />

        <SolicitationFilter
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

        <RangeModal
          open={rangeFilter.open}
          onClose={rangeFilter.handleClose}
          title="Filtro de Período"
          initialField={rangeFilter.range.field}
          initialStart={rangeFilter.range.start}
          initialEnd={rangeFilter.range.end}
          fieldOptions={dateFieldOptions}
          onApply={async (vals) => {
            const ok = await fetchTable({ range: vals, page: 1 });
            if (ok) {
              rangeFilter.setRange(vals);
              rangeFilter.setOpen(false);
              table.setPage(1);
            }
          }}
        />

        <StatusDrawer
          open={statusDrawer.open}
          selectedIds={statusDrawer.selectedIds}
          fromStatusIds={statusDrawer.fromStatusIds}
          onClose={() => setStatusDrawer({ ...statusDrawer, open: false })}
          onSave={() => fetchTable()}
        />

        <GenerateDocumentDrawer
          open={generateDocumentDrawer.open}
          solicitations={generateDocumentDrawer.solicitations}
          onClose={() => setGenerateDocumentDrawer({ open: false, solicitations: [] })}
          onSave={() => fetchTable()}
        />

        <GenerateFreightLetterDrawer
          open={generateFreightLetterDrawer.open}
          solicitations={generateFreightLetterDrawer.solicitations}
          onClose={() => setGenerateFreightLetterDrawer({ open: false, solicitations: [] })}
          onSave={() => fetchTable()}
        />

        <SolicitationDocumentViewerDrawer
          open={documentViewerDrawer.open}
          solicitation={documentViewerDrawer.solicitation}
          onClose={() => setDocumentViewerDrawer({ ...documentViewerDrawer, open: false })}
          onRefresh={() => fetchTable()}
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
  )
}
