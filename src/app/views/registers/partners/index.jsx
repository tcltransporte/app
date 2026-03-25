'use client';

import React from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Google as GoogleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Badge } from '@mui/material';

import { PartnerDetail } from './partner.detail';
import { PartnerFilter } from './filter';
import { useTable, useNavigation, useFilter, useExport } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import { Container, Table, Toolbar, LoadingOverlay } from '@/components/common';
import * as partnerService from '@/app/services/partner.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export function RegistersPartners({ partnerId, initialTable, initialFilters }) {

  const navigation = useNavigation('/registers/partners', partnerId)

  const table = useTable({ initialTable })

  const filter = useFilter({ initialFilters })
  const exporter = useExport()

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.id)
  const handleCloseModal = () => navigation.setSelectedId(undefined)

  const handleSave = () => {
    fetchTable()
    handleCloseModal()
  }

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true)
    try {
      const result = await partnerService.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        filters: overrides.filters || filter.filters,
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
      alert.error('Ops!', error?.body?.message)
      return false
    } finally {
      table.setLoading(false)
    }
  }, [table.page, table.rowsPerPage, filter.filters, table.sortBy, table.sortOrder])

  const isFirstMount = React.useRef(true)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // Auto-fetch removed
  }, [])

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

  const handleExport = async (format = ExportFormat.EXCEL) => {
    exporter.setExporting(true);
    try {
      const params = {
        filters: filter.filters,
        sortBy: table.sortBy,
        sortOrder: table.sortOrder,
        columns: displayColumns
      };

      const result = await partnerService.exportTable({
        ...params,
        format
      });

      await exporter.processResponse(result, {
        fileName: 'parceiros',
        format
      });
    } finally {
      exporter.setExporting(false);
    }
  };

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
    ...(table.selecteds.length === 1 ? [
      { label: 'Editar', icon: <EditIcon />, variant: 'outlined', color: 'primary', onClick: () => navigation.setSelectedId(table.selecteds[0].id) },
    ] : []),
    ...(table.selecteds.length > 0 ? [
      { label: 'Excluir', icon: <DeleteIcon />, variant: 'outlined', color: 'error', onClick: handleDelete },
    ] : []),
  ]

  const secondaryActions = [
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

      <Container.Title items={[{ label: 'Cadastros' }, { label: 'Clientes' }]} />

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

        <PartnerDetail
          partnerId={navigation.selectedId}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

        <PartnerFilter
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
