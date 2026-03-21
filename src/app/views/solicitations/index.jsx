'use client';

import React from 'react';
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
} from '@mui/icons-material';

import SolicitationDetail from './solicitation.detail';
import SolicitationFilter from './filter';
import { StatusDrawer } from './status-drawer';
import { useTable, useNavigation, useRangeFilter, useFilter, useExport } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import { Container, Table, Toolbar, RangeModal, LoadingOverlay } from '@/components/common';
import * as solicitationService from '@/app/services/solicitation.service';
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
      // Em uma implementação real, chamaria o serviço para gerar o link ou PDF
      alert.info(`Gerando documento para ${row.number}...`);
    };

    const hasGenerate = row.solicitationStatus?.generateDocument === true;

    if (!hasGenerate) return null;

    return (
      <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
          <MenuItem 
            onClick={handleGenerateDocument}
            sx={{ gap: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 'auto !important' }}>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Gerar documento" primaryTypographyProps={{ variant: 'body2' }} />
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  const navigation = useNavigation(`/solicitations/${solicitationType?.hash}`, selectedId)

  const [statusDrawer, setStatusDrawer] = React.useState({ open: false, selectedIds: [], fromStatusIds: [] });

  const table = useTable({ initialTable })
  const filter = useFilter(initialFilters)
  const rangeFilter = useRangeFilter(initialRange, dateFieldOptions)
  const exporter = useExport()

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.id)
  const handleCloseModal = () => navigation.setSelectedId(undefined)

  const handleSave = () => {
    fetchTable()
    handleCloseModal()
  }

  const fetchTable = React.useCallback(async () => {
    table.setLoading(true)
    try {
      const result = await solicitationService.findAll({
        page: table.page,
        limit: table.rowsPerPage,
        filters: filter.filters,
        range: rangeFilter.range,
        sortBy: table.sortBy,
        sortOrder: table.sortOrder
      })

      if (result.status !== ServiceStatus.SUCCESS)
        throw result

      table.setItems(result.items || [])
      table.setTotal(result.total || 0)
      table.setSelecteds([])

    } catch (error) {
      alert.error('Erro ao carregar', error?.message || 'Ocorreu um erro ao buscar solicitações.')
    } finally {
      table.setLoading(false)
    }
  }, [table.page, table.rowsPerPage, filter.filters, rangeFilter.range, table.sortBy, table.sortOrder])

  const isFirstMount = React.useRef(true)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    fetchTable()
  }, [fetchTable])

  React.useEffect(() => {
    filter.setFilters(prev => ({ ...prev, typeHash: solicitationType?.hash }));
    table.setPage(1);
  }, [solicitationType])

  const handleDelete = async () => {

    if (!table.selecteds.length) return

    const confirmed = await alert.confirm(
      'Tem certeza?',
      `Deseja realmente excluir ${table.selecteds.length} solicitação(ões)?`,
      'warning'
    )

    if (!confirmed) return

    table.setLoading(true)

    try {

      for (const item of table.selecteds) {
        await solicitationService.destroy(item.id)
      }

      await fetchTable()
      alert.success('Solicitação(ões) excluída(s) com sucesso!')

    } catch (error) {
      alert.error('Erro ao excluir', 'Ocorreu um problema ao tentar excluir os registros.')
    } finally {
      table.setLoading(false)
    }
  }

  const handleExport = async (format = ExportFormat.EXCEL) => {
    try {

      exporter.setExporting(true);

      const params = {
        filters: filter.filters,
        range: rangeFilter.range,
        sortBy: table.sortBy,
        sortOrder: table.sortOrder,
        columns: displayColumns
      };

      const result = await solicitationService.exportTable({
        ...params,
        format
      });

      await exporter.processResponse(result, {
        fileName: 'solicitacoes',
        format
      });

    } finally {
      exporter.setExporting(false);
    }
  };

  const columns = [
    { field: 'number', headerName: 'Número', width: 100 },
    {
      field: 'partnerId', headerName: 'Fornecedor', width: 500,
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
          <Typography variant="body2" sx={{ lineHeight: 1 }}>{row.solicitationStatus?.description || 'Pendente'}</Typography>
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
      width: 50,
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
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => navigation.setSelectedId(null) },
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
    ...(table.selecteds.length === 1 ? [
      { label: 'Editar', icon: <EditIcon />, variant: 'outlined', color: 'primary', onClick: () => navigation.setSelectedId(table.selecteds[0].id) },
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

        <LoadingOverlay
          open={exporter.exporting}
          title="Preparando Excel"
          subtitle="Isso pode levar alguns segundos dependendo da quantidade de dados."
        />

        <Table
          columns={displayColumns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onRowDoubleClick={handleRowDoubleClick}
          onSort={table.handleSort}
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
        />

        <SolicitationFilter
          open={filter.open}
          filters={filter.filters}
          onClose={filter.handleClose}
          onApply={(vals) => {
            filter.handleApply(vals, () => table.setPage(1))
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
          onApply={(vals) => {
            rangeFilter.handleApply(vals, () => table.setPage(1))
          }}
        />

        <StatusDrawer
          open={statusDrawer.open}
          selectedIds={statusDrawer.selectedIds}
          fromStatusIds={statusDrawer.fromStatusIds}
          onClose={() => setStatusDrawer({ ...statusDrawer, open: false })}
          onSave={() => fetchTable()}
        />

      </Container.Content>

      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        selectedCount={table.selecteds.length}
        onPageChange={table.handlePageChange}
        onRowsPerPageChange={table.handleRowsPerPageChange}
      />

    </Container>
  )
}
