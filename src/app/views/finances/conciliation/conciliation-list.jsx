'use client';

import React from 'react';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useLoading, useRangeFilter, useExport, useNavigation, useFilter } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { Typography, Badge, Avatar, Box, IconButton } from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckIcon,
  Undo as UndoIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import ConciliationFilter from './conciliation-filter';
import ConciliationApproveDrawer from './conciliation-approve-drawer';
import UnifiedChip from '@/components/common/UnifiedChip';

export default function ConciliationList({ initialTable, selectedId, initialRange, initialFilters = { status: 'not_conciled' } }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const exporter = useExport();
  const { selectedId: selectedBankAccountId, setSelectedId: setSelectedBankAccountId } = useNavigation('/finances/conciliation', selectedId);
  const filter = useFilter({ initialFilters });
  const [approveDrawerOpen, setApproveDrawerOpen] = React.useState(false);
  const [selectedMovementsForApproval, setSelectedMovementsForApproval] = React.useState([]);
  const [selectedMovementIdsForApproval, setSelectedMovementIdsForApproval] = React.useState([]);

  const rangeFilter = useRangeFilter({
    initialRange,
    dateFieldOptions: [
      { label: 'Data Real', value: 'realDate' },
      { label: 'Data de Lançamento', value: 'entryDate' },
    ]
  });

  const fetchTable = React.useCallback(async (overrides = {}) => {
    table.setLoading(true);
    try {
      const where = {
        ...(overrides.where || {}),
        ...(selectedBankAccountId ? { bankAccountId: selectedBankAccountId } : {})
      };

      const result = await financeAction.findAllBankMovements({
        page: overrides.page || table.page,
        limit: overrides.rowsPerPage || table.rowsPerPage,
        where,
        filters: overrides.filters || filter.filters,
        range: overrides.range || rangeFilter.range,
        sortBy: overrides.sortBy || table.sortBy || undefined,
        sortOrder: overrides.sortOrder || table.sortOrder || undefined
      });

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      table.setItems(result.body.rows || []);
      table.setTotal(result.body.count || 0);
      table.setSelecteds([]);
      return true;
    } catch (error) {
      alert.error('Ops!', error?.body?.message || error.message);
      return false;
    } finally {
      table.setLoading(false);
      loading.hide();
    }
  }, [table.page, table.rowsPerPage, table.sortBy, table.sortOrder, rangeFilter.range, selectedBankAccountId, filter.filters]);

  const handleApproveConciliation = React.useCallback(async () => {
    if (table.selecteds.length === 0) return;

    const hasConciled = table.selecteds.some((row) => !!row.isConciled);
    if (hasConciled) {
      alert.warning('Operação Inválida', 'Selecione apenas movimentos não conciliados.');
      return;
    }

    setSelectedMovementsForApproval(table.selecteds);
    setSelectedMovementIdsForApproval(table.selecteds.map((row) => row.id).filter(Boolean));
    setApproveDrawerOpen(true);
  }, [table.selecteds]);

  const handleApproveConciliationRow = React.useCallback(async (row) => {
    if (!row?.id || row?.isConciled) return;
    setSelectedMovementsForApproval([row]);
    setSelectedMovementIdsForApproval([row.id]);
    setApproveDrawerOpen(true);
  }, []);

  const handleRejectConciliation = React.useCallback(async () => {
    if (table.selecteds.length === 0) return;

    const verb = table.selecteds.length > 1 ? 'as conciliações selecionadas' : 'a conciliação selecionada';
    const ok = await alert.confirm(
      'Reprovar conciliação?',
      `Isso irá desfazer pagamento/recebimento para ${verb}.`,
      'warning'
    );
    if (!ok) return;

    loading.show('Reprovando conciliação...', 'Aguarde alguns instantes.');
    try {
      const ids = table.selecteds.map((row) => row.id).filter(Boolean);
      for (const movementId of ids) {
        const result = await financeAction.reverseSettlementFromBankMovement(movementId);
        if (result.header.status !== ServiceStatus.SUCCESS) {
          throw result;
        }
      }

      alert.success('Sucesso', 'Conciliação reprovada com sucesso!');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível reprovar', error?.body?.message || error.message);
    } finally {
      loading.hide();
    }
  }, [table.selecteds, fetchTable, loading]);

  const handleRejectConciliationRow = React.useCallback(async (row) => {
    if (!row?.id) return;

    const ok = await alert.confirm(
      'Reprovar conciliação?',
      'Isso irá desfazer pagamento/recebimento deste movimento.',
      'warning'
    );
    if (!ok) return;

    loading.show('Reprovando conciliação...', 'Aguarde alguns instantes.');
    try {
      const result = await financeAction.reverseSettlementFromBankMovement(row.id);
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      alert.success('Sucesso', 'Conciliação reprovada com sucesso!');
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível reprovar', error?.body?.message || error.message);
    } finally {
      loading.hide();
    }
  }, [fetchTable, loading]);

  const handleConfirmApproveBatch = React.useCallback(async (values) => {
    if (!selectedMovementIdsForApproval.length) return;

    loading.show('Aprovando conciliação...', 'Aguarde alguns instantes.');
    try {
      const movementPayloads = Array.isArray(values?.movements)
        ? values.movements
        : [];

      if (movementPayloads.length === 0) {
        throw new Error('Nenhum movimento válido para aprovação');
      }

      for (const item of movementPayloads) {
        const result = await financeAction.approveConciliationMovement({
          movementId: item.movementId,
          realDate: item.realDate,
          bankAccountId: item.bankAccount?.id || item.bankAccount
        });
        if (result.header.status !== ServiceStatus.SUCCESS) {
          throw result;
        }
      }

      alert.success('Sucesso', 'Conciliação em lote aprovada com sucesso!');
      setApproveDrawerOpen(false);
      setSelectedMovementsForApproval([]);
      setSelectedMovementIdsForApproval([]);
      await fetchTable();
    } catch (error) {
      alert.error('Não foi possível conciliar', error?.body?.message || error.message);
    } finally {
      loading.hide();
    }
  }, [selectedMovementIdsForApproval, fetchTable, loading]);

  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchTable();
  }, [fetchTable]);

  const columns = React.useMemo(() => [
    {
      field: 'realDate', headerName: 'Data Real', width: 170, align: 'center',
      renderCell: (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }) : ''
    },
    {
      field: 'bankAccountId', headerName: 'Conta', width: 220,
      renderCell: (val, row) => {
        const acc = row.bankAccount;
        if (!acc) return '';
        const bankIcon = acc?.bank?.code ? `/assets/banks/${acc.bank.code}.png` : undefined;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              variant="rounded"
              src={bankIcon}
              alt={acc?.bank?.description || acc.bankName || 'Banco'}
              sx={{
                width: 20,
                height: 20,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
              imgProps={{ loading: 'lazy' }}
            >
              <BankIcon sx={{ fontSize: 14 }} />
            </Avatar>
            <span>{acc.description || acc.bankName || ''}</span>
          </Box>
        )
      }
    },
    { field: 'documentNumber', headerName: 'Nº Doc.', width: 120 },
    {
      field: 'value', headerName: 'Valor', width: 110, align: 'right',
      renderCell: (val, row) => (
        <Typography variant="body2" sx={{ color: row.typeId == 1 ? 'success.main' : 'error.main' }}>
          {(() => {
            const parsedValue = Number(val) || 0;
            const roundedValue = Math.round(parsedValue * 100) / 100;
            const absoluteValue = Math.abs(roundedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const sign = row.typeId == 1 ? '+' : '-';
            return `${sign} ${absoluteValue}`;
          })()}
        </Typography>
      )
    },
    { field: 'description', headerName: 'Descrição', flex: 1 },
    {
      field: 'status', headerName: 'Status', width: 140, align: 'center',
      renderCell: (val, row) => {
        const isConciled = !!row?.isConciled;
        return (
          <UnifiedChip
            label={isConciled ? 'Conciliado' : 'Pendente'}
            color={isConciled ? 'success' : 'warning'}
            variant="outlined"
            title={isConciled ? 'Conciliado' : 'Pendente'}
            showActionOnHover
            actionSx={{
              minWidth: 92,
              width: 92,
              justifyContent: 'center',
              px: 0.25,
            }}
            actionContent={(
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                <span title="Conciliar">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveConciliationRow(row);
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </span>
                <span title="Desfazer">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectConciliationRow(row);
                    }}
                    sx={{
                      color: 'error.main',
                      '&:hover': { backgroundColor: 'error.lighter' },
                    }}
                  >
                    <UndoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Box>
            )}
          />
        );
      }
    },
  ], [handleApproveConciliationRow, handleRejectConciliationRow]);

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length]);

  const handleExport = async (format) => {
    loading.show('Gerando arquivo...', 'Aguarde um momento');
    try {
      await exporter.exportData({
        format,
        service: financeAction.findAllBankMovements,
        params: {
          filters: filter.filters,
          range: rangeFilter.range,
          sortBy: table.sortBy,
          sortOrder: table.sortOrder
        },
        columns: table.orderedColumns,
        title: 'Exportação de Conciliação'
      });
    } finally {
      loading.hide();
    }
  };

  return (
    <Container>
      <Container.Title items={[{ label: 'Finanças' }, { label: 'Conciliação' }]} />

      <Container.Content>
        <Toolbar
          primary={table.selecteds.length > 0 ? [
            {
              label: 'Conciliar',
              icon: <CheckIcon />,
              variant: 'contained',
              color: 'success',
              onClick: handleApproveConciliation
            },
            {
              label: 'Desfazer',
              icon: <UndoIcon />,
              variant: 'outlined',
              color: 'error',
              onClick: handleRejectConciliation
            }
          ] : null}
          secondary={[
            { label: rangeFilter.label, icon: <EventIcon fontSize="small" />, onClick: rangeFilter.handleOpen },
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
                { label: 'Exportar para Excel', icon: <DownloadIcon fontSize="small" />, onClick: () => handleExport(ExportFormat.EXCEL) },
                { label: 'Exportar para Google Sheets', icon: <GoogleIcon fontSize="small" />, onClick: () => handleExport(ExportFormat.GOOGLE_SHEETS) }
              ]
            }
          ]}
        />

        <Table
          columns={table.orderedColumns.length > 0 ? table.orderedColumns : columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          containerSx={{ minHeight: 0 }}
          onSort={(property) => {
            const isAsc = table.sortBy === property && table.sortOrder === 'ASC';
            const newOrder = isAsc ? 'DESC' : 'ASC';
            table.setSortOrder(newOrder);
            table.setSortBy(property);
            table.setPage(1);
          }}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onColumnsReorder={table.setOrderedColumns}
          widths={table.columnWidths}
          onResize={table.handleColumnResize}
          loading={table.loading}
          fixed
        />
      </Container.Content>

      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        selectedCount={table.selecteds.length}
        onPageChange={(e, p) => table.setPage(p)}
        onRowsPerPageChange={(e) => {
          const l = Number(e.target.value);
          table.setRowsPerPage(l);
          table.setPage(1);
        }}
      />

      <RangeModal
        open={rangeFilter.open}
        onClose={rangeFilter.handleClose}
        title="Filtro de Período"
        initialField={rangeFilter.range.field}
        initialStart={rangeFilter.range.start}
        initialEnd={rangeFilter.range.end}
        fieldOptions={[
          { label: 'Data Real', value: 'realDate' },
          { label: 'Data de Lançamento', value: 'entryDate' },
        ]}
        onApply={(vals) => {
          rangeFilter.setRange(vals);
          rangeFilter.setOpen(false);
          table.setPage(1);
        }}
      />

      <ConciliationFilter
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

      <ConciliationApproveDrawer
        open={approveDrawerOpen}
        movements={selectedMovementsForApproval}
        selectedCount={selectedMovementIdsForApproval.length}
        onClose={() => {
          setApproveDrawerOpen(false);
          setSelectedMovementsForApproval([]);
          setSelectedMovementIdsForApproval([]);
        }}
        onConfirm={handleConfirmApproveBatch}
      />
    </Container>
  );
}
