'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Visibility as ViewIcon,
  Sync as SyncIcon,
  History as HistoryIcon,
  TipsAndUpdates as AwarenessIcon,
  CheckCircle as ConfirmationIcon,
  Cancel as UnknownOperationIcon,
  Block as OperationNotPerformedIcon
} from '@mui/icons-material';
import { IconButton } from '@mui/material';

import DistributionFilter from './filter';
import DFeDistributionXmlViewer from './xml-viewer';
import DistributionManifestEventsDrawer from './manifest-events-drawer';
import { useTable, useNavigation, useRangeFilter, useFilter, useLoading } from '@/hooks';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import * as dfeLoteDistAction from '@/app/actions/dfeLoteDist.action';
import { ManifestationType } from '@/libs/dfeManifestationType';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

/** Resumo (resNFe) aceita manifestação; NF-e processada (procNFe / nfeProc) não. Após outros eventos, encerra. */
function distributionCanManifest(row) {
  const hasLast =
    row.lastManifestEventId != null &&
    row.lastManifestEventId !== ''
  if (hasLast && !row.lastManifestEvent?.manifestationCode) return false

  const lastCode = row.lastManifestEvent?.manifestationCode
  if (lastCode && lastCode !== ManifestationType.Awareness.code) return false
  if (lastCode === ManifestationType.Awareness.code) return true

  const schemaLower = (row.schemaInfo?.schema || '').toLowerCase()
  if (schemaLower.includes('procnfe')) return false
  if (schemaLower.includes('resnfe') || row.idSchema === 2) return true
  /* Lista só com DfeRepositorioNFe: sem schema no payload, permite manifestar (validação no serviço). */
  if (!schemaLower && (row.idSchema == null || row.idSchema === '')) return true
  return false
}

/**
 * Enquanto `DfeRepositorioNFe.LastManifestEventId` for null: só Ciência da Operação.
 * Com último evento em Ciência (após registrar ciência): Confirmação, Desconhecimento e Operação não realizada.
 */
function orderedManifestationTypes(row) {
  const hasLast =
    row.lastManifestEventId != null &&
    row.lastManifestEventId !== ''

  if (!hasLast) {
    return [ManifestationType.Awareness]
  }

  const lastCode = row.lastManifestEvent?.manifestationCode
  if (lastCode === ManifestationType.Awareness.code) {
    return [
      ManifestationType.Confirmation,
      ManifestationType.UnknownOperation,
      ManifestationType.OperationNotPerformed,
    ]
  }

  return []
}

const MANIFESTATION_UI = {
  [ManifestationType.Awareness.code]: { Icon: AwarenessIcon, color: 'info', title: ManifestationType.Awareness.label },
  [ManifestationType.Confirmation.code]: { Icon: ConfirmationIcon, color: 'success', title: ManifestationType.Confirmation.label },
  [ManifestationType.UnknownOperation.code]: { Icon: UnknownOperationIcon, color: 'error', title: ManifestationType.UnknownOperation.label },
  [ManifestationType.OperationNotPerformed.code]: { Icon: OperationNotPerformedIcon, color: 'warning', title: ManifestationType.OperationNotPerformed.label },
}

export default function DistributionView({
  initialTable,
  initialFilters,
  initialRange,
  dateFieldOptions = [
    { value: 'dhEmi', label: 'Emissão' },
    { value: 'data', label: 'Sincronização' }
  ]
}) {
  const table = useTable({ initialTable })
  const filter = useFilter({ initialFilters })
  const rangeFilter = useRangeFilter({ initialRange, dateFieldOptions })
  const loading = useLoading()

  const [xmlViewer, setXmlViewer] = React.useState({ open: false, xml: '', nsu: '' })
  const [manifestEventsDrawer, setManifestEventsDrawer] = React.useState({
    open: false,
    nsu: '',
    items: null,
    loading: false,
  })

  const handleManifest = async (id, manifestation) => {
    loading.show()
    try {
      const result = await dfeLoteDistAction.manifest(id, manifestation)
      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      const label = result.body?.label || manifestation.label
      alert.success(`Manifestação (${label}) registrada com sucesso.`)
      fetchTable()
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  }

  const handleViewManifestEvents = async (row) => {
    setManifestEventsDrawer({
      open: true,
      nsu: row.nsu ?? '',
      items: null,
      loading: true,
    })
    loading.show()
    try {
      const result = await dfeLoteDistAction.findManifestEvents(row.id)
      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      setManifestEventsDrawer((prev) => ({
        ...prev,
        items: result.body || [],
        loading: false,
      }))
    } catch (error) {
      setManifestEventsDrawer((prev) => ({ ...prev, items: [], loading: false }))
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  }

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

  const handleSync = async () => {
    loading.show()
    try {
      const result = await dfeLoteDistAction.sync()
      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      const n = result.body?.count ?? 0
      alert.success(
        'Sucesso!',
        n > 0
          ? `${n} documento(s) gravado(s) em DFeLoteDist. Use Pesquisar para atualizar a grade.`
          : 'Nenhum documento novo na distribuição. Use Pesquisar para atualizar a grade.'
      )
      await fetchTable({ notifyRepositorio: true })
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
        sortBy: overrides.sortBy || table.sortBy || 'dhEmi',
        sortOrder: overrides.sortOrder || table.sortOrder || 'ASC'
      })

      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      table.setItems(result.body.items || [])
      table.setTotal(result.body.total || 0)
      table.setSelecteds([])

      const rp = result.body.repositorio?.count ?? 0
      if (overrides.notifyRepositorio === true && rp > 0) {
        alert.success('Repositório', `${rp} registro(s) processado(s) em DfeRepositorioNFe.`)
      }

      return true

    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
      return false
    } finally {
      table.setLoading(false)
      loading.hide()
    }
  }, [table.page, table.rowsPerPage, filter.filters, rangeFilter.range, table.sortBy, table.sortOrder])

  const columns = [
    {
      field: 'numeroDoc',
      headerName: 'Nº NF',
      width: 100,
      renderCell: (value) => (value != null && value !== '' && Number(value) !== 0 ? String(value) : ''),
    },
    {
      field: 'chNFe', headerName: 'Chave de acesso', width: 340,
      renderCell: (value) => (value ? <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography> : '')
    },
    { field: 'cnpj', headerName: 'CNPJ', width: 150 },
    { field: 'xNome', headerName: 'Razão Social', width: 250 },
    {
      field: 'vNF', headerName: 'Valor', width: 120,
      renderCell: (value) => value ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''
    },
    {
      field: 'dhEmi', headerName: 'Emissão', width: 180,
      renderCell: (value) => value ? new Date(value).toLocaleString() : ''
    },
    /*{
      field: 'isUnPack', headerName: 'Descompactado', width: 140,
      renderCell: (value) => (
        <Chip 
          label={value ? 'Sim' : 'Não'} 
          color={value ? 'success' : 'warning'} 
          size="small" 
          variant="outlined" 
        />
      )
    },*/
    {
      field: 'actions', headerName: 'Ações', width: 260,
      renderCell: (value, row) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5,
          flexWrap: 'wrap',
          opacity: 0,
          transition: 'opacity 0.2s',
          '.MuiTableRow-root:hover &': {
            opacity: 1
          }
        }}>
          <IconButton
            size="small"
            color="primary"
            disabled={!row.xmlLoteDistId}
            onClick={() => row.xmlLoteDistId && handleViewXml(row.xmlLoteDistId, row.xmlLoteNsu ?? '')}
            title={
              row.xmlLoteDistId
                ? 'Visualizar XML (NF-e processada)'
                : 'XML disponível apenas quando existir distribuição vinculada com schema de NF-e processada (IdSchema = 3).'
            }
          >
            <ViewIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="secondary"
            onClick={() => handleViewManifestEvents(row)}
            title="Eventos de manifestação"
          >
            <HistoryIcon fontSize="small" />
          </IconButton>

          {distributionCanManifest(row) && orderedManifestationTypes(row).map((mt) => {
            const ui = MANIFESTATION_UI[mt.code]
            if (!ui) return null
            const { Icon, color, title } = ui
            return (
              <IconButton
                key={mt.code}
                size="small"
                color={color}
                onClick={() => handleManifest(row.id, mt)}
                title={title}
              >
                <Icon fontSize="small" />
              </IconButton>
            )
          })}
        </Box>
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
      onClick: () => fetchTable({ notifyRepositorio: true }),
    }
  ];

  return (
    <Container>
      <Container.Title items={[{ label: 'Sefaz' }, { label: 'Distribuição' }]} />

      <Container.Content>
        <Toolbar
          primary={[
            {
              label: 'Atualizar',
              icon: <SyncIcon fontSize="small" />,
              onClick: handleSync,
              color: 'primary'
            }
          ]}
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

        <DistributionManifestEventsDrawer
          open={manifestEventsDrawer.open}
          nsu={manifestEventsDrawer.nsu}
          items={manifestEventsDrawer.items}
          loading={manifestEventsDrawer.loading}
          onClose={() =>
            setManifestEventsDrawer((prev) => ({
              ...prev,
              open: false,
              items: null,
              loading: false,
            }))
          }
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
