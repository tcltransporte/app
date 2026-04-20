'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  CloudDownload as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';

import DistributionFilter from './filter';
import DFeDistributionXmlViewer from './xml-viewer';
import { useTable, useNavigation, useRangeFilter, useFilter, useLoading } from '@/hooks';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import * as dfeLoteDistAction from '@/app/actions/dfeLoteDist.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export default function DistributionView({
  initialTable,
  initialFilters,
  initialRange,
  dateFieldOptions = [{ value: 'data', label: 'Data' }]
}) {
  const table = useTable({ initialTable })
  const filter = useFilter({ initialFilters })
  const rangeFilter = useRangeFilter({ initialRange, dateFieldOptions })
  const loading = useLoading()

  const [xmlViewer, setXmlViewer] = React.useState({ open: false, xml: '', nsu: '' })

  const handleViewXml = async (id, nsu) => {
    loading.show()
    try {
      const result = await dfeLoteDistAction.getDecodedDoc(id)
      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      setXmlViewer({
        open: true,
        xml: result.body,
        nsu: nsu
      })
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  }

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true)
    try {
      const result = await dfeLoteDistAction.findAll({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        filters: overrides.filters || filter.filters,
        range: overrides.range || rangeFilter.range,
        sortBy: overrides.sortBy || table.sortBy || 'id',
        sortOrder: overrides.sortOrder || table.sortOrder || 'DESC'
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

  React.useEffect(() => {
    fetchTable()
  }, [])

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nsu', headerName: 'NSU', width: 150 },
    { field: 'idSchema', headerName: 'Schema', width: 100 },
    {
      field: 'data', headerName: 'Data', width: 180,
      renderCell: (value) => value ? new Date(value).toLocaleString() : ''
    },
    {
      field: 'isUnPack', headerName: 'Descompactado', width: 140,
      renderCell: (value) => (
        <Chip 
          label={value ? 'Sim' : 'Não'} 
          color={value ? 'success' : 'warning'} 
          size="small" 
          variant="outlined" 
        />
      )
    },
    { field: 'idDFeLoteDistOrigem', headerName: 'ID Origem', width: 120 },
    {
      field: 'actions', headerName: 'Ações', width: 80,
      renderCell: (value, row) => (
        <IconButton size="small" color="primary" onClick={() => handleViewXml(row.id, row.nsu)} title="Visualizar XML">
          <ViewIcon fontSize="small" />
        </IconButton>
      )
    }
  ]

  const secondaryActions = [
    {
      label: rangeFilter.label,
      icon: <EventIcon fontSize="small" />,
      onClick: rangeFilter.handleOpen
    },
    {
      label: 'Filtros',
      icon: <FilterIcon fontSize="small" />,
      onClick: filter.handleOpen
    },
    {
      label: 'Pesquisar',
      icon: <SearchIcon fontSize="small" />,
      variant: 'outlined',
      color: 'primary',
      onClick: () => fetchTable(),
    }
  ];

  return (
    <Container>
      <Container.Title items={[{ label: 'Sefaz' }, { label: 'Distribuição' }]} />

      <Container.Content>
        <Toolbar
          primary={[]}
          secondary={secondaryActions}
        />

        <Table
          columns={columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
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

        <DistributionFilter
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

        <DFeDistributionXmlViewer
          open={xmlViewer.open}
          xml={xmlViewer.xml}
          nsu={xmlViewer.nsu}
          onClose={() => setXmlViewer(prev => ({ ...prev, open: false }))}
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
