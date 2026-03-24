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
  const filter = useFilter(initialFilters)
  const navigation = useNavigation(`/documents/${documentType?.initials?.toLowerCase() || ''}`, selectedId)

  const fetchTable = React.useCallback(async () => {
    table.setLoading(true)
    try {
      const result = await documentService.findAll({
        slug: documentType?.initials,
        page: table.page,
        limit: table.rowsPerPage,
        filters: filter.filters
      })

      if (result.header.status !== ServiceStatus.SUCCESS) throw result

      table.setItems(result.body.items || [])
      table.setTotal(result.body.total || 0)
    } catch (error) {
      alert.error('Erro ao carregar', error?.header?.message || 'Ocorreu um erro ao buscar documentos.')
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
    fetchTable()
  }, [table.page, table.rowsPerPage, filter.filters])

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
          loading={table.loading}
        />
        <DocumentDetail 
          documentId={navigation.selectedId}
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
        onPageChange={table.handlePageChange}
        onRowsPerPageChange={table.handleRowsPerPageChange}
      />
    </Container>
  )
}
