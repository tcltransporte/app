'use client';

import React from 'react';
import { Box, Typography, Tooltip, IconButton as MuiIconButton } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import { Container, Table, Toolbar, LoadingOverlay } from '@/components/common';
import { DocumentDetail } from './document-detail';
import { useTable, useNavigation, useFilter } from '@/hooks';
import * as documentService from '@/app/services/document.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export default function DocumentView({
  initialTable,
  initialFilters,
  documentType,
  selectedId
}) {
  const table = useTable({ initialTable })
  const filter = useFilter({ initialFilters })
  const navigation = useNavigation(`/documents/${documentType?.initials?.toLowerCase() || ''}`, selectedId)

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true)
    try {
      const result = await documentService.findAll({
        slug: documentType?.initials,
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        filters: overrides.filters || filter.filters,
        sortBy: overrides.sortBy || table.sortBy || undefined,
        sortOrder: overrides.sortOrder || table.sortOrder || undefined
      })

      if (result.header.status !== ServiceStatus.SUCCESS) throw result

      table.setItems(result.body.items || [])
      table.setTotal(result.body.total || 0)
      return true
    } catch (error) {
      console.error('Erro ao buscar documentos:', error?.body?.message || error)
      alert.error('Erro ao carregar', error?.body?.message || 'Ocorreu um erro ao buscar documentos.')
      return false
    } finally {
      table.setLoading(false)
    }
  }, [table.page, table.rowsPerPage, filter.filters, documentType?.initials])

  const isFirstMount = React.useRef(true)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // Auto-fetch removed to avoid unwanted triggers
  }, [])

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'invoiceNumber', headerName: 'Número NF', width: 120 },
    {
      field: 'invoiceDate', headerName: 'Data NF', width: 150,
      renderCell: (val) => val ? new Date(val).toLocaleDateString() : ''
    },
    {
      field: 'partner', headerName: 'Fornecedor', width: 350,
      renderCell: (val) => val?.surname || val?.name || ''
    },
    {
      field: 'invoiceValue', headerName: 'Valor', width: 150,
      renderCell: (val) => val ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''
    },
    {
        field: 'description', headerName: 'Descrição', flex: 1
    }
  ]

  React.useEffect(() => {
    if (table.orderedColumns.length === 0) {
      table.setOrderedColumns(columns)
    }
  }, [])

  const primaryActions = [
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => navigation.setSelectedId(null) },
    ...(table.selecteds.length === 1 ? [
      { label: 'Editar', icon: <EditIcon />, variant: 'outlined', color: 'primary', onClick: () => navigation.setSelectedId(table.selecteds[0].id) },
    ] : []),
  ]

  return (
    <Container>
      <Container.Title items={[{ label: 'Documentos' }, { label: documentType?.surname || documentType?.description || 'Lista' }]} />
      <Container.Content>
        <Toolbar
          primary={primaryActions}
          secondary={[
            {
               label: 'Pesquisar',
               icon: <SearchIcon fontSize="small" />,
               onClick: fetchTable
            }
          ]}
        />
        <Table
          columns={columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onRowDoubleClick={(row) => navigation.setSelectedId(row.id)}
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
          loading={table.loading}
        />
        <DocumentDetail 
          document={navigation.selectedId !== undefined ? { id: navigation.selectedId } : undefined}
          documentType={documentType}
          onClose={() => navigation.setSelectedId(undefined)}
          onSave={() => {
            fetchTable()
            navigation.setSelectedId(undefined)
          }}
        />
      </Container.Content>
      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
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
