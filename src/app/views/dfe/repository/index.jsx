'use client';

import React from 'react';
import { Box, Typography, Chip, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
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
import * as dfeLoteDistAction from '@/app/actions/dfe-repository.action';
import { ManifestationType } from '@/libs/dfeManifestationType';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import JSZip from 'jszip';

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
  const [actionMenu, setActionMenu] = React.useState({ anchorEl: null, row: null })
  const [batchManifestMenuEl, setBatchManifestMenuEl] = React.useState(null)

  const sanitizeFilePart = React.useCallback((value, fallback) => {
    const cleaned = String(value ?? '')
      .trim()
      .replace(/[^\w.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
    return cleaned || fallback
  }, [])

  const triggerZipDownload = React.useCallback(async (zip, zipName) => {
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = zipName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [])

  const buildAndDownloadXmlZip = React.useCallback(async (rows) => {
    const zip = new JSZip()
    const missingAccessKeys = []

    for (const row of rows) {
      const accessKey = String(row.chNFe ?? '').trim() || '(sem chave)'
      if (!row.xmlLoteDistId) {
        missingAccessKeys.push(accessKey)
        continue
      }

      const result = await dfeLoteDistAction.getDecodedDoc(row.xmlLoteDistId)
      if (result.header.status !== ServiceStatus.SUCCESS)
        throw result

      const xml = String(result.body ?? '').trim()
      if (!xml) {
        missingAccessKeys.push(accessKey)
        continue
      }

      const baseName = sanitizeFilePart(accessKey, `xml_${row.id}`)
      zip.file(`${baseName}.xml`, xml)
    }

    if (missingAccessKeys.length > 0) {
      throw new Error(`XML não disponível para a(s) chave(s): ${missingAccessKeys.join(', ')}`)
    }

    const zipName = `xml-distribuicao-${new Date().toISOString().slice(0, 10)}.zip`
    await triggerZipDownload(zip, zipName)
  }, [sanitizeFilePart, triggerZipDownload])

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

  const handleDownloadXml = async (row) => {
    loading.show()
    try {
      await buildAndDownloadXmlZip([row])
      alert.success('Sucesso!', 'XML baixado em arquivo ZIP.')
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  }

  const handleDownloadSelectedXml = async () => {
    if (!table.selecteds.length) {
      alert.error('Ops!', 'Selecione ao menos um registro para baixar o XML.')
      return
    }

    loading.show()
    try {
      await buildAndDownloadXmlZip(table.selecteds)
      alert.success('Sucesso!', `${table.selecteds.length} XML(s) baixado(s) em arquivo ZIP.`)
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message)
    } finally {
      loading.hide()
    }
  }

  const selectedBatchManifestationTypes = React.useMemo(() => {
    const allowed = new Map()
    for (const row of table.selecteds) {
      if (!distributionCanManifest(row)) continue
      for (const mt of orderedManifestationTypes(row)) {
        if (!allowed.has(mt.code)) allowed.set(mt.code, mt)
      }
    }
    return Array.from(allowed.values())
  }, [table.selecteds])

  const handleManifestSelected = async (manifestation) => {
    if (!table.selecteds.length) {
      alert.error('Ops!', 'Selecione ao menos um registro para manifestar.')
      return
    }

    const blocked = []
    for (const row of table.selecteds) {
      const key = String(row.chNFe ?? '').trim() || `ID ${row.id}`
      const canManifest = distributionCanManifest(row)
      const supportsType = orderedManifestationTypes(row).some((mt) => mt.code === manifestation.code)
      if (!canManifest || !supportsType) {
        blocked.push(key)
      }
    }

    if (blocked.length > 0) {
      alert.error(
        'Ops!',
        `Registro(s) não permitido(s) para ${manifestation.label}: ${blocked.join(', ')}`
      )
      return
    }

    loading.show()
    let successCount = 0
    const errors = []

    try {
      for (const row of table.selecteds) {
        const key = String(row.chNFe ?? '').trim() || `ID ${row.id}`

        try {
          const result = await dfeLoteDistAction.manifest(row.id, manifestation)
          if (result.header.status !== ServiceStatus.SUCCESS) {
            throw result
          }
          successCount += 1
        } catch (error) {
          errors.push(`${key}: ${error?.body?.message || error.message}`)
        }
      }

      if (successCount > 0) {
        alert.success('Sucesso!', `${successCount} registro(s) manifestado(s) com ${manifestation.label}.`)
        await fetchTable()
      }

      if (errors.length > 0) {
        alert.error('Ops!', `Falha em ${errors.length} registro(s): ${errors.join(' | ')}`)
      }
    } finally {
      loading.hide()
    }
  }

  const openActionMenu = (event, row) => {
    event.stopPropagation()
    setActionMenu({ anchorEl: event.currentTarget, row })
  }

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, row: null })
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
      field: 'dhEmi', headerName: 'Emissão', width: 180,
      renderCell: (value) => value ? new Date(value).toLocaleString() : ''
    },
    {
      field: 'numeroDoc',
      headerName: 'Número',
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
      field: 'vNF', headerName: 'Valor', width: 120, align: 'right',
      renderCell: (value) => value ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
    },
    {
      field: 'actions', headerName: '', width: 60, align: 'center',
      renderCell: (value, row) => {
        const isActiveRowMenu = Boolean(actionMenu.anchorEl) && actionMenu.row?.id === row.id
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              opacity: isActiveRowMenu ? 1 : 0,
              pointerEvents: isActiveRowMenu ? 'auto' : 'none',
              transition: 'opacity 0.2s',
              '.MuiTableRow-root:hover &': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            }}
          >
            <IconButton
              size="small"
              color="primary"
              onClick={(event) => openActionMenu(event, row)}
              title="Ações"
              sx={{
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
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
      <Container.Title items={[{ label: 'DFe' }, { label: 'Repositório' }]} />

      <Container.Content>
        <Toolbar
          primary={[
            {
              label: 'Atualizar',
              icon: <SyncIcon fontSize="small" />,
              onClick: handleSync,
              color: 'primary'
            },
            ...(table.selecteds.length > 0
              ? [{
                  label: 'Manifestar',
                  icon: <AwarenessIcon fontSize="small" />,
                  onClick: (event) => setBatchManifestMenuEl(event.currentTarget),
                  color: 'primary',
                  variant: 'outlined',
                },
                {
                  label: 'Baixar XML',
                  icon: <DownloadIcon fontSize="small" />,
                  onClick: handleDownloadSelectedXml,
                  color: 'primary',
                }]
              : [])
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

        <Menu
          anchorEl={batchManifestMenuEl}
          open={Boolean(batchManifestMenuEl)}
          onClose={() => setBatchManifestMenuEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                '& .MuiMenuItem-root .MuiListItemIcon-root': {
                  color: 'text.secondary',
                  transition: 'color 0.2s ease',
                },
                '& .MuiMenuItem-root:hover .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
              },
            },
          }}
        >
          {selectedBatchManifestationTypes.length === 0 && (
            <MenuItem disabled>
              <ListItemText>Nenhum tipo disponível</ListItemText>
            </MenuItem>
          )}
          {selectedBatchManifestationTypes.map((mt) => {
            const ui = MANIFESTATION_UI[mt.code]
            if (!ui) return null
            const { Icon, title, color } = ui
            return (
              <MenuItem
                key={`batch-${mt.code}`}
                onClick={() => {
                  setBatchManifestMenuEl(null)
                  handleManifestSelected(mt)
                }}
                sx={{
                  '&:hover .manifest-icon': {
                    color: `${color}.main`,
                  },
                }}
              >
                <ListItemIcon
                  className="manifest-icon"
                  sx={{
                    color: 'text.secondary',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{title}</ListItemText>
              </MenuItem>
            )
          })}
        </Menu>

        <Menu
          anchorEl={actionMenu.anchorEl}
          open={Boolean(actionMenu.anchorEl)}
          onClose={closeActionMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                '& .MuiMenuItem-root .MuiListItemIcon-root': {
                  color: 'text.secondary',
                  transition: 'color 0.2s ease',
                },
                '& .MuiMenuItem-root:hover .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
              },
            },
          }}
        >
          <MenuItem
            disabled={!actionMenu.row?.xmlLoteDistId}
            onClick={() => {
              const row = actionMenu.row
              closeActionMenu()
              if (row?.xmlLoteDistId) handleViewXml(row.xmlLoteDistId, row.xmlLoteNsu ?? '')
            }}
          >
            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Visualizar XML</ListItemText>
          </MenuItem>

          <MenuItem
            disabled={!actionMenu.row?.xmlLoteDistId}
            onClick={() => {
              const row = actionMenu.row
              closeActionMenu()
              if (row?.xmlLoteDistId) handleDownloadXml(row)
            }}
          >
            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Baixar XML</ListItemText>
          </MenuItem>

          {distributionCanManifest(actionMenu.row || {}) && (
            <Divider />
          )}

          {distributionCanManifest(actionMenu.row || {}) && orderedManifestationTypes(actionMenu.row || {}).map((mt) => {
            const ui = MANIFESTATION_UI[mt.code]
            if (!ui) return null
            const { Icon, title, color } = ui
            return (
              <MenuItem
                key={mt.code}
                onClick={() => {
                  const row = actionMenu.row
                  closeActionMenu()
                  if (row) handleManifest(row.id, mt)
                }}
                sx={{
                  '&:hover .manifest-icon': {
                    color: `${color}.main`,
                  },
                }}
              >
                <ListItemIcon
                  className="manifest-icon"
                  sx={{
                    color: 'text.secondary',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{title}</ListItemText>
              </MenuItem>
            )
          })}

          <Divider />

          <MenuItem
            onClick={() => {
              const row = actionMenu.row
              closeActionMenu()
              if (row) handleViewManifestEvents(row)
            }}
          >
            <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Manifestações</ListItemText>
          </MenuItem>
        </Menu>
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
