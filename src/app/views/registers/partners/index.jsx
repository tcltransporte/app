'use client';

import React from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { Badge } from '@mui/material';

import { PartnerDetail } from './partner.detail';
import { PartnerFilter } from './filter';
import { useTable, useNavigation, useRangeFilter, useFilter } from '@/hooks';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import * as partnerService from '@/app/services/partner.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export function RegistersPartners({ partnerId, initialTable, initialFilters, initialRange, dateFieldOptions = [] }) {

  const navigation = useNavigation('/registers/partners', partnerId)

  const table = useTable({ initialTable })

  const filter = useFilter(initialFilters)
  const rangeFilter = useRangeFilter(initialRange, dateFieldOptions)

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.id)
  const handleCloseModal = () => navigation.setSelectedId(undefined)

  const handleSave = () => {
    fetchTable()
    handleCloseModal()
  }

  const fetchTable = React.useCallback(async () => {
    table.setLoading(true)
    try {
      const result = await partnerService.findAll({
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
      console.error('Erro ao buscar parceiros:', error)
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

  const handleDelete = async () => {
    if (!table.selecteds.length) return

    const confirmed = await alert.confirm(
      'Tem certeza?',
      `Deseja realmente excluir ${table.selecteds.length} parceiro(s)?`,
      'warning'
    )

    if (!confirmed) return

    table.setLoading(true)
    try {
      for (const item of table.selecteds) {
        await partnerService.destroy(item.id)
      }
      await fetchTable()
      alert.success('Parceiro(s) excluído(s) com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert.error('Erro ao excluir', 'Ocorreu um problema ao tentar excluir os registros.')
    } finally {
      table.setLoading(false)
    }
  }

  const columns = [
    { field: 'id', headerName: 'Código', width: 90 },
    { field: 'cpfCnpj', headerName: 'CPF/CNPJ', width: 150 },
    { field: 'surname', headerName: 'Nome', fontWeight: 500 },
    { field: 'name', headerName: 'Razão Social' },
    {
      field: 'birthDate', headerName: 'Data Nasc.', width: 110,
      renderCell: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      }
    },
    {
      field: 'isActive', headerName: 'Ativo', align: 'center', width: 80,
      renderCell: (value) => value ? 'Sim' : 'Não'
    },
  ]

  // Initialize columns in hook if not already done
  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns)
    }
  }, [columns, table.orderedColumns.length, table.setOrderedColumns])

  const displayColumns = table.orderedColumns.length > 0 ? table.orderedColumns : columns

  const primaryActions = [
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => navigation.setSelectedId(null) },
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
    { label: 'Pesquisar', icon: <SearchIcon />, color: 'primary', variant: 'outlined', onClick: () => fetchTable() },
  ];

  return (
    <Container>

      <Container.Title items={[{ label: 'Cadastros' }, { label: 'Clientes' }]} />

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
          onSort={table.handleSort}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onColumnsReorder={table.setOrderedColumns}
          widths={table.columnWidths}
          onResize={table.handleColumnResize}
          loading={table.loading}
        />

        <PartnerDetail
          partnerId={navigation.selectedId}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

        <PartnerFilter
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
