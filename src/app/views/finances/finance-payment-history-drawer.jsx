'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  Paper,
  Tooltip,
  Button,
  Grid,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Schedule as TimeIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ListAlt as ListIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Formik, Form, Field, FieldArray } from 'formik';
import { AutoComplete, DateField, NumericField, SelectField } from '@/components/controls';
import * as paymentAction from '@/app/actions/payment.action';
// import * as bankAccountAction from '@/app/actions/bankAccount.action';

import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

const validatePayment = (values) => {
  const errors = {};
  if (!values.date) errors.date = 'Obrigatório';

  const itemErrors = values.items.map(item => {
    const error = {};
    const totalComp = item.composition.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    if (Math.abs(totalComp - item.value) > 0.01) {
      error.compositionMessage = 'Valor incompleto';
    }

    const compErrors = item.composition.map(c => {
      const e = {};
      if (!c.paymentMethodId) e.paymentMethodId = 'Obrigatório';
      if (!c.bankAccountId) e.bankAccountId = 'Obrigatório';
      return Object.keys(e).length > 0 ? e : null;
    });

    if (compErrors.some(e => e !== null)) error.composition = compErrors;
    return Object.keys(error).length > 0 ? error : null;
  });

  if (itemErrors.some(e => e !== null)) {
    errors.items = itemErrors;
  }

  return errors;
};

const InstallmentRow = ({ item, index, formData, data, handleSearch, textFn }) => {
  const [expanded, setExpanded] = React.useState(true);
  const totalInformadoRow = item.composition.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const isDivergent = Math.abs(totalInformadoRow - item.value) > 0.01;

  return (
    <React.Fragment>
      <TableRow sx={{ backgroundColor: 'action.hover' }}>
        <TableCell colSpan={2} sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>#{item.documentNumber} {item.personName}</Typography>
            <Typography variant="caption" color="text.secondary">Venc: {item.dueDate ? format(new Date(item.dueDate), 'dd/MM/yyyy') : '-'}</Typography>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            {isDivergent && (
              <Tooltip title={`Divergência: Parcela (R$ ${item.value.toFixed(2)}) ≠ Meios (R$ ${totalInformadoRow.toFixed(2)})`}>
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {item.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}>Ações</TableCell>
                  <TableCell>Meio</TableCell>
                  <TableCell>Conta</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <FieldArray name={`items.${index}.composition`}>
                  {({ push, remove }) => (
                    <React.Fragment>
                      {item.composition.map((comp, cIdx) => (
                        <TableRow key={cIdx} hover>
                          <TableCell sx={{ py: 0.5 }}>
                            {item.composition.length > 1 && (
                              <IconButton size="small" color="error" onClick={() => remove(cIdx)}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.paymentMethodId`}
                              component={SelectField}
                              label="Meio"
                              options={formData.methods.map(m => ({ value: m.id, label: m.description }))}
                              fullWidth
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.5, minWidth: 220 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.bankAccountId`}
                              component={AutoComplete}
                              label="Conta"
                              onSearch={handleSearch}
                              text={textFn}
                              fullWidth
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.value`}
                              component={NumericField}
                              label="Valor"
                              fullWidth
                              size="small"
                              align="right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} sx={{ p: 0.5 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => push({ value: 0, paymentMethodId: '', bankAccountId: '', description: '' })}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', ml: 1 }}
                          >
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )}
                </FieldArray>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default function FinancePaymentHistoryDrawer({ entryIds, open, onClose, onSuccess, zIndex }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [formData, setFormData] = React.useState({ methods: [] });
  const formikRef = React.useRef(null);

  const fetchHistory = React.useCallback(async () => {
    const ids = (Array.isArray(entryIds) ? entryIds : [entryIds])
      .filter(Boolean)
      .map(item => (typeof item === 'object' && item !== null ? item.id : item))
      .map(Number)
      .filter(id => !isNaN(id));

    if (ids.length === 0) return;

    setLoading(true);
    try {
      const result = await paymentAction.fetchHistory(ids);

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw new Error(result.body?.message || 'Erro ao buscar histórico');
      }

      const historyData = result.body;
      setData(historyData);

      if (!historyData.payment) {
        setFormData({
          methods: historyData.methods || []
        });
      }

    } catch (error) {
      console.error('Error fetching payment history:', error);
      alert.error('Erro!', 'Não foi possível carregar as informações das parcelas para pagamento.');
    } finally {
      setLoading(false);
    }
  }, [entryIds]);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    } else {
      setData(null);
    }
  }, [open, fetchHistory]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await paymentAction.executePayment({
        settlements: values.items.map(item => ({
          entryId: item.entryId,
          composition: item.composition.map(c => ({
            ...c,
            bankAccountId: c.bankAccountId?.id || c.bankAccountId
          }))
        })),
        commonData: {
          date: values.date
        }
      });

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      alert.success('Sucesso', 'Pagamento realizado com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplicate = (values, setFieldValue) => {
    const first = values.items[0];
    if (!first) return;

    const newItems = values.items.map((item, idx) => {
      if (idx === 0) return item;
      return {
        ...item,
        composition: first.composition.map(c => ({
          ...c,
          value: first.composition.length === 1 ? item.value : c.value
        }))
      };
    });
    setFieldValue('items', newItems);
    alert.success('Copiado!', 'Dados da primeira parcela replicados para as demais.');
  };

  const handleSearchGlobal = React.useCallback(async (q) => {
    try {
      const response = await fetch('/api/search/bankAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: q })
      });

      if (!response.ok) throw new Error('Falha na busca');
      return await response.json();
    } catch (error) {
      console.error('Error searching bank accounts:', error);
      return [];
    }
  }, []);



  const textFnGlobal = React.useCallback((v) =>
    (v && typeof v === 'object') ? (v.description || v.bankName || '') : '',
    []);

  const handleGlobalChange = (field, value, setFieldValue, currentValues) => {
    const newItems = currentValues.items.map(item => {
      const newComposition = [...item.composition];
      if (newComposition.length > 0) {
        if (field === 'paymentMethodId') {
          newComposition[0] = { ...newComposition[0], paymentMethodId: value };
        } else if (field === 'bankAccount') {
          newComposition[0] = { ...newComposition[0], bankAccountId: value };
        }
      }
      return { ...item, composition: newComposition };
    });
    setFieldValue('items', newItems);
  };

  const renderHistory = () => {
    if (!data?.payment) return null;
    const { payment } = data;

    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: -30, width: 2, bgcolor: 'divider' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CheckIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>PAGAMENTO REALIZADO</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {payment.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data da Baixa: {format(new Date(payment.date), 'dd/MM/yyyy')}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>

        {(payment.paymentEntries || []).map((entry) => (
          <Box key={entry.id} sx={{ mb: 4, ml: 4, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: 20, top: 40, bottom: (entry.bankMovements?.length > 0) ? -30 : 0, width: 2, bgcolor: 'divider', borderLeft: '2px dashed', borderColor: 'divider' }} />
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <PaymentIcon fontSize="small" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {entry.paymentMethod?.description ? entry.paymentMethod.description.toUpperCase() : 'COMPOSIÇÃO'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {entry.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {entry.paymentMethodNumber ? `Nº Documento: ${entry.paymentMethodNumber}` : 'Sem nº doc.'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">(ID: {entry.id})</Typography>
                  </Box>
                </Paper>
              </Box>
            </Stack>

            {(entry.bankMovements || []).map((move) => (
              <Box key={move.id} sx={{ mt: 3, ml: 6 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: move.isReconciled ? 'info.main' : 'warning.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <BankIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {move.bankAccount?.bank?.description && (
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                        {move.bankAccount.bank.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: move.isReconciled ? 'info.main' : 'warning.main', textTransform: 'uppercase' }}>
                      {move.bankAccount ? `${move.bankAccount.bankName} - Ag: ${move.bankAccount.agency} / Cc: ${move.bankAccount.accountNumber}` : (move.isReconciled ? 'MOVIMENTO CONCILIADO' : 'MOVIMENTO PENDENTE')}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, borderRadius: 2, borderStyle: 'dotted' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{move.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
                        <Tooltip title="Data Real do Lançamento">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{move.realDate ? format(new Date(move.realDate), 'dd/MM/yyyy') : 'Aguardando'}</Typography>
                          </Stack>
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                        "{move.description || 'Sem descrição no extrato'}"
                      </Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const initialValues = React.useMemo(() => {
    if (!data || data.payment) return { date: new Date(), items: [] };
    return {
      date: new Date(),
      globalPaymentMethodId: '',
      globalBankAccount: null,
      items: data.selectedEntries.map(entry => ({
        entryId: entry.id,
        value: Number(entry.installmentValue) || 0,
        installmentNumber: entry.installmentNumber,
        documentNumber: entry.title?.documentNumber || '',
        personName: entry.title?.partner?.name || entry.title?.partner?.surname || 'N/A',
        dueDate: entry.dueDate,
        composition: [{
          value: Number(entry.installmentValue) || 0,
          paymentMethodId: '',
          bankAccountId: null,
          description: ''
        }]
      }))
    };
  }, [data]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: zIndex || ((theme) => theme.zIndex.modal + 2) }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 750 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validate={validatePayment}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting, setFieldValue, submitForm }) => (
          <Form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {loading
                  ? 'Carregando...'
                  : data?.payment
                    ? 'Histórico de Pagamento'
                    : `Baixar Títulos: ${data?.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
              </Typography>
              <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </Box>
            <Divider />

            {/* Body */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, position: 'relative' }}>
              {loading ? (
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.6)'
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 10,
                }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Buscando informações...
                  </Typography>
                </Box>
              ) : data?.payment ? (
                renderHistory()
              ) : (
                <>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item size={{ xs: 12, sm: 3 }}>
                        <Field
                          name="date"
                          component={DateField}
                          label="Data"
                          fullWidth
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 4 }}>
                        <Field
                          name="globalPaymentMethodId"
                          component={SelectField}
                          label="Meio"
                          options={formData.methods.map(m => ({ value: m.id, label: m.description }))}
                          fullWidth
                          onChange={(val) => handleGlobalChange('paymentMethodId', val, setFieldValue, values)}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 5 }}>
                        <Field
                          name="globalBankAccount"
                          component={AutoComplete}
                          label="Conta"
                          onSearch={handleSearchGlobal}
                          text={textFnGlobal}
                          fullWidth
                          onChange={(val) => handleGlobalChange('bankAccount', val, setFieldValue, values)}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box>
                    {/*
                    <Box sx={{ px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      {data?.batchMode && (
                        <Button size="small" variant="text" onClick={() => handleReplicate(values, setFieldValue)} startIcon={<ArrowIcon sx={{ transform: 'rotate(90deg)' }} />}>
                          Replicar 1ª para todas
                        </Button>
                      )}
                    </Box>
                    */}
                    <Table size="small">
                      <TableBody>
                        {values.items.map((item, index) => (
                          <InstallmentRow
                            key={item.entryId}
                            item={item}
                            index={index}
                            formData={formData}
                            data={data}
                            handleSearch={handleSearchGlobal}
                            textFn={textFnGlobal}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              )}
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
              {!loading && !data?.payment && (
                <>
                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={onClose}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={submitForm}
                      disabled={isSubmitting}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {isSubmitting ? 'Processando...' : 'Confirmar'}
                    </Button>
                  </Stack>
                </>
              )}
              {!loading && data?.payment && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onClose}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Fechar
                </Button>
              )}
            </Box>
          </Form>
        )}
      </Formik>
    </Drawer>
  );
}
