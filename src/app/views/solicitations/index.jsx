'use client';

import React from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { Badge } from '@mui/material';

import SolicitationDetail from './solicitation.detail';
import SolicitationFilter from './filter';
import { useTable, useNavigation, useRangeFilter, useFilter, useExport } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import { Container, Table, Toolbar, RangeModal, SplitButton, LoadingOverlay } from '@/components/common';
import * as solicitationService from '@/app/services/solicitation.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export default function SolicitationView({
  initialTable,
  initialFilters,
  initialRange,
  dateFieldOptions = [],
  typeHash,
  solicitationType
}) {

  const navigation = useNavigation(`/solicitations/${typeHash}`, undefined)

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
      console.error('Erro ao buscar solicitações:', error)
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
    filter.setFilters(prev => ({ ...prev, typeHash }));
    table.setPage(1);
  }, [typeHash])

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
      console.error('Erro ao excluir:', error)
      alert.error('Erro ao excluir', 'Ocorreu um problema ao tentar excluir os registros.')
    } finally {
      table.setLoading(false)
    }
  }

  const handleExport = async (format = ExportFormat.EXCEL) => {
    exporter.setExporting(true);
    try {
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
      field: 'statusId', headerName: 'Status', width: 120,
      renderCell: (value) => {
        const statuses = {
          1: 'Pendente',
          2: 'Em Andamento',
          3: 'Concluído',
          4: 'Cancelado'
        };
        return statuses[value] || 'Pendente';
      }
    },
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
          typeHash={typeHash}
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
          initialStart={rangeFilter.range.start}
          initialEnd={rangeFilter.range.end}
          initialField={rangeFilter.range.field}
          fieldOptions={dateFieldOptions}
          onApply={(vals) => {
            rangeFilter.handleApply(vals, () => table.setPage(1))
          }}
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
