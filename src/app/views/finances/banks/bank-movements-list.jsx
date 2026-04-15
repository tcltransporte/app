'use client';

import React from 'react';
import { Container, Table, Toolbar, RangeModal } from '@/components/common';
import { useTable, useLoading, useRangeFilter, useExport, useNavigation } from '@/hooks';
import { ExportFormat } from '@/hooks/useExport';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import { Box, Typography, Chip, Card, CardContent, Skeleton, Avatar, Divider, IconButton } from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  CheckCircle as CheckIcon,
  AccountBalance as BankIcon,
  SwapHoriz as SwapHorizIcon,
  ArrowCircleUp as UpIcon,
  ArrowCircleDown as DownIcon,
  AllInclusive as AllIcon,
  Add as AddIcon,
  AccountTree as HistoryIcon,
} from '@mui/icons-material';

import FinanceTitleDetailsDrawer from '../finance-title-details-drawer';
import BankMovementModal from './bank-movement-modal';
import BankAccountDrawer from './bank-account-drawer';
import BankMovementTraceDrawer from './bank-movement-trace-drawer';
import BankTransferModal from './bank-transfer-modal';

export default function BankMovementsList({ title, initialTable, initialRange, initialBankAccounts, selectedId }) {
  const table = useTable({ initialTable });
  const loading = useLoading();
  const exporter = useExport();
  const { selectedId: selectedBankAccountId, setSelectedId: setSelectedBankAccountId } = useNavigation('/finances/banks', selectedId);
  const [bankAccounts, setBankAccounts] = React.useState(Array.isArray(initialBankAccounts) ? initialBankAccounts : []);
  const [showBankAccounts, setShowBankAccounts] = React.useState(false);
  const [movementModalOpen, setMovementModalOpen] = React.useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = React.useState(false);
  const [traceMovementId, setTraceMovementId] = React.useState(null);
  const [traceOpen, setTraceOpen] = React.useState(false);
  const [transferModalOpen, setTransferModalOpen] = React.useState(false);

  const fetchBankAccounts = React.useCallback(async () => {
    const result = await financeAction.findBankBalances();
    if (result.header.status === ServiceStatus.SUCCESS) {
      setBankAccounts(result.body || []);
    }
  }, []);

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
  }, [
    table.page,
    table.rowsPerPage,
    table.sortBy,
    table.sortOrder,
    rangeFilter.range,
    selectedBankAccountId
  ]);

  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchTable();
  }, [fetchTable]);

  React.useEffect(() => {
    setBankAccounts(Array.isArray(initialBankAccounts) ? initialBankAccounts : []);
  }, [initialBankAccounts]);

  const selectedBankAccount = React.useMemo(() => {
    if (!selectedBankAccountId) return null;
    return bankAccounts.find((a) => a.id == selectedBankAccountId) || null;
  }, [bankAccounts, selectedBankAccountId]);

  const getBankIcon = React.useCallback((bank) => {
    //if (bank?.icon) return bank.icon;
    if (bank?.code) return `/assets/banks/${bank.code}.png`;
    return undefined;
  }, []);


  const columns = React.useMemo(() => [
    {
      field: 'realDate', headerName: 'Data Real', width: 150, align: 'center',
      renderCell: (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }) : ''
    },
    {
      field: 'bankAccount', headerName: 'Conta', width: 220,
      renderCell: (val, row) => {
        const acc = row.bankAccount;
        if (!acc) return '';
        return `${acc.bankName} - Ag: ${acc.agency} / Cc: ${acc.accountNumber}`
      }
    },
    {
      field: 'documentNumber', headerName: 'Nº Doc.', width: 120,
    },
    {
      field: 'value', headerName: 'Valor', width: 110, align: 'right',
      renderCell: (val, row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: row.typeId == 1 ? 'success.main' : 'error.main'
          }}
        >
          {val ? parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
        </Typography>
      )
    },
    {
      field: 'description', headerName: 'Descrição', flex: 1,
    },
    {
      field: 'isReconciled', headerName: 'Conc.', width: 80, align: 'center',
      renderCell: (val) => (
        val ? <CheckIcon color="success" fontSize="small" /> : null
      )
    },
    {
      field: 'trace', headerName: 'Rastreio', width: 80, align: 'center',
      renderCell: (val, row) => (
        <IconButton
          size="small"
          onClick={() => {
            setTraceMovementId(row.id);
            setTraceOpen(true);
          }}
          disabled={!row.paymentEntryId}
          title={row.paymentEntryId ? "Rastrear Origem" : "Sem Informação de Origem"}
        >
          <HistoryIcon fontSize="small" color={row.paymentEntryId ? "primary" : "disabled"} />
        </IconButton>
      )
    }
  ], []);

  React.useEffect(() => {
    if (table.orderedColumns.length === 0 && columns.length > 0) {
      table.setOrderedColumns(columns);
    }
  }, [table.orderedColumns.length]);

  const handleExport = async (format) => {
    loading.show('Gerando arquivo...', 'Aguarde um momento')
    try {
      await exporter.exportData({
        format,
        service: financeAction.findAllBankMovements,
        params: {
          range: rangeFilter.range,
          sortBy: table.sortBy,
          sortOrder: table.sortOrder
        },
        columns: table.orderedColumns,
        title: `Exportação de ${title}`
      })
    } finally {
      loading.hide()
    }
  };

  const totalBalance = React.useMemo(() => {
    return bankAccounts.reduce((acc, curr) => acc + (Number(curr.currentBalance) || 0), 0);
  }, [bankAccounts]);

  return (
    <Container>
      <Container.Title items={[{ label: 'Finanças' }, { label: 'Bancos' }]} />

      <Container.Content>
        <Toolbar
          primary={[
            {
              label: selectedBankAccount ? selectedBankAccount.description : 'Todas as contas',
              icon: selectedBankAccount ? (
                <Avatar
                  variant="rounded"
                  src={getBankIcon(selectedBankAccount?.bank)}
                  alt={selectedBankAccount?.bank?.description || selectedBankAccount?.bankName || 'Banco'}
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  imgProps={{ loading: 'lazy' }}
                >
                  <BankIcon sx={{ fontSize: 14 }} />
                </Avatar>
              ) : (
                <BankIcon fontSize="small" />
              ),
              endIcon: <SwapHorizIcon fontSize="small" sx={{ opacity: 0.8 }} />,
              variant: 'outlined',
              color: 'primary',
              onClick: () => setShowBankAccounts((v) => !v),
            },
            {
              label: 'Incluir',
              icon: <AddIcon />,
              variant: 'contained',
              color: 'success',
              onClick: () => setMovementModalOpen(true),
            },
            {
              label: 'Transferência',
              icon: <SwapHorizIcon />,
              variant: 'outlined',
              color: 'primary',
              onClick: () => setTransferModalOpen(true),
            },
          ]}
          secondary={[
            {
              label: rangeFilter.label,
              icon: <EventIcon fontSize="small" />,
              onClick: rangeFilter.handleOpen
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
          ]}
        />

        {showBankAccounts && (
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              overflowY: 'hidden',
              flexShrink: 0,
              py: 0.5,
              px: 0.5,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'stretch',
            }}
          >
            {bankAccounts.length > 0 && (
              <Card
                key="all-accounts-card"
                variant="outlined"
                onClick={() => {
                  setSelectedBankAccountId(null);
                  table.setPage(1);
                  setShowBankAccounts(false);
                }}
                sx={{
                  width: 240,
                  minHeight: 96,
                  flex: '0 0 240px',
                  cursor: 'pointer',
                  borderColor: !selectedBankAccountId ? 'primary.main' : undefined,
                  bgcolor: !selectedBankAccountId ? 'action.selected' : undefined,
                  display: 'flex',
                }}
              >
                <CardContent sx={{ pb: '16px !important', height: '100%', display: 'flex', gap: 1, alignItems: 'stretch', width: '100%' }}>
                  <Box
                    sx={{
                      width: 44,
                      flex: '0 0 44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        border: '1px solid',
                        borderColor: 'primary.dark',
                      }}
                    >
                      <AllIcon />
                    </Avatar>
                  </Box>

                  <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                      Todas as contas
                    </Typography>

                    <Typography variant="caption" color="text.secondary" component="div" noWrap>
                      Soma de saldos
                    </Typography>

                    <Box
                      sx={{
                        mt: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography variant="caption" component="div" noWrap sx={{ fontWeight: 800, flex: '0 0 auto' }}>
                        {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}



            {bankAccounts.length === 0
              ? Array.from({ length: 3 }).map((_, idx) => (
                <Card
                  key={`bank-account-skeleton-${idx}`}
                  variant="outlined"
                  sx={{ width: 240, minHeight: 80, flex: '0 0 240px' }}
                >
                  <CardContent>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="90%" />
                  </CardContent>
                </Card>
              ))
              : bankAccounts.map((acc) => (
                <Card
                  key={acc.id}
                  variant="outlined"
                  onClick={() => {
                    setSelectedBankAccountId(acc.id);
                    table.setPage(1);
                    setShowBankAccounts(false);
                  }}
                  sx={{
                    width: 240,
                    minHeight: 96,
                    flex: '0 0 240px',
                    cursor: 'pointer',
                    borderColor: selectedBankAccountId === acc.id ? 'primary.main' : undefined,
                    bgcolor: selectedBankAccountId === acc.id ? 'action.selected' : undefined,
                  }}
                >
                  <CardContent sx={{ pb: '16px !important', height: '100%', display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <Box
                      sx={{
                        width: 44,
                        flex: '0 0 44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Avatar
                        variant="rounded"
                        src={getBankIcon(acc?.bank)}
                        alt={acc?.bank?.description || acc?.bankName || 'Banco'}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        imgProps={{ loading: 'lazy' }}
                      >
                        <BankIcon fontSize="small" />
                      </Avatar>
                    </Box>

                    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                        {acc.description}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" component="div" noWrap>
                        Ag: {acc.agency} / Cc: {acc.accountNumber}
                      </Typography>

                      <Box
                        sx={{
                          mt: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          minWidth: 0,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" component="div" noWrap sx={{ minWidth: 0 }}>
                          {acc.bankName}
                        </Typography>
                        <Typography variant="caption" component="div" noWrap sx={{ fontWeight: 800, flex: '0 0 auto' }}>
                          {acc.currentBalance == null
                            ? '—'
                            : Number(acc.currentBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}

            {bankAccounts.length > 0 && (
              <Card
                variant="outlined"
                onClick={() => setAccountDrawerOpen(true)}
                sx={{
                  width: 240,
                  minHeight: 96,
                  flex: '0 0 240px',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                  }
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'transparent', color: 'inherit', border: '1px dashed' }}>
                    <AddIcon />
                  </Avatar>
                  <Typography variant="caption" fontWeight={700}>
                    CADASTRAR NOVA CONTA
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        <Table
          columns={table.orderedColumns.length > 0 ? table.orderedColumns : columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          containerSx={{ minHeight: 0 }}
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
          fixed
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
        onApply={async (vals) => {
          const ok = await fetchTable({ range: vals, page: 1 });
          if (ok) {
            rangeFilter.setRange(vals);
            rangeFilter.setOpen(false);
            table.setPage(1);
          }
        }}
      />

      <BankMovementModal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        initialBankAccount={selectedBankAccount}
        onSuccess={() => fetchTable()}
      />
      <BankAccountDrawer
        open={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
        onSuccess={fetchBankAccounts}
      />
      <BankMovementTraceDrawer
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        movementId={traceMovementId}
      />
      <BankTransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={() => {
          fetchTable();
          fetchBankAccounts();
        }}
      />
    </Container>
  );
}
