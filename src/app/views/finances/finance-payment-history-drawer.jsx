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
  History as HistoryIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Formik, Form, Field, FieldArray } from 'formik';
import { AutoComplete, DateField, NumericField, SelectField } from '@/components/controls';
import * as paymentAction from '@/app/actions/payment.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import * as search from '@/libs/search';
import FinanceHistoryTimeline from './finance-history-timeline';
import FinanceEntryModal from './finance-entry-modal';

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
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{Number(item.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ py: 0, px: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 6 }}>Forma</TableCell>
                  <TableCell>Conta Bancária</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>Valor</TableCell>
                  <TableCell width={40}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <FieldArray name={`items.${index}.composition`}>
                  {({ push, remove }) => (
                    <React.Fragment>
                      {item.composition.map((comp, cIdx) => (
                        <TableRow key={cIdx}>
                          <TableCell sx={{ pl: 6 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.paymentMethodId`}
                              component={SelectField}
                              options={formData.methods.map(m => ({ value: m.id, label: m.description }))}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <Field
                              name={`items.${index}.composition.${cIdx}.bankAccountId`}
                              component={AutoComplete}
                              onSearch={handleSearch}
                              text={textFn}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.value`}
                              component={NumericField}
                              size="small"
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            {item.composition.length > 1 && (
                              <IconButton size="small" color="error" onClick={() => remove(cIdx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
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

export default function FinancePaymentHistoryDrawer({ entryIds, open, onClose, onSuccess, zIndex, operationType }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [formData, setFormData] = React.useState({ methods: [] });
  const [selectedEntryId, setSelectedEntryId] = React.useState(null);
  const [entryModalOpen, setEntryModalOpen] = React.useState(false);
  const formikRef = React.useRef(null);

  const handleOpenEntry = (id) => {
    setSelectedEntryId(id);
    setEntryModalOpen(true);
  };

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

  const textFnGlobal = React.useCallback((v) =>
    (v && typeof v === 'object') ? (v.description || v.bankName || '') : '',
    []);

  const handleSearchGlobal = search.bankAccount;

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
        <FinanceHistoryTimeline>
          <FinanceHistoryTimeline.Payment
            totalValue={payment.totalValue}
            date={payment.date}
            label={operationType === 1 ? 'RECEBIDO' : 'PAGO'}
          />

          {(payment.paymentEntries || []).map((entry) => (
            <FinanceHistoryTimeline.Composition
              key={entry.id}
              description={entry.paymentMethod?.description}
              value={entry.value}
              methodNumber={entry.paymentMethodNumber}
              id={entry.id}
              hasChildren={entry.bankMovements?.length > 0}
            >
              {(entry.bankMovements || []).map((move) => (
                <FinanceHistoryTimeline.Movement
                  key={move.id}
                  bank={move.bankAccount?.bank}
                  accountInfo={move.bankAccount ? `${move.bankAccount.bankName} - Ag: ${move.bankAccount.agency} / Cc: ${move.bankAccount.accountNumber}` : null}
                  value={move.value}
                  realDate={move.realDate}
                  description={move.description}
                  isReconciled={move.isReconciled}
                />
              ))}
            </FinanceHistoryTimeline.Composition>
          ))}
        </FinanceHistoryTimeline>
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
<>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ zIndex: zIndex || ((theme) => theme.zIndex.modal + 2) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 700 }, display: 'flex', flexDirection: 'column' } }}
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
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {data?.payment ? <HistoryIcon /> : <ReceiptIcon />}
                  <Typography variant="h6" fontWeight={700}>
                    {loading
                      ? 'Carregando...'
                      : data?.payment
                        ? 'Histórico de Pagamento'
                        : `Baixar Títulos: ${data?.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0, position: 'relative', bgcolor: 'background.default' }}>
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
                  <>
                    <FinanceHistoryTimeline.Installments 
                      entries={data.payment.entries} 
                      onEdit={handleOpenEntry}
                    />
                    {renderHistory()}
                  </>
                ) : (
                  <Box sx={{ p: 2 }}>
                    {values.items.length > 1 && (
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <Field
                              name="date"
                              component={DateField}
                              label="Data"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Field
                              name="globalPaymentMethodId"
                              component={SelectField}
                              label="Forma"
                              options={formData.methods.map(m => ({ value: m.id, label: m.description }))}
                              fullWidth
                              onChange={(val) => handleGlobalChange('paymentMethodId', val, setFieldValue, values)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={5}>
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
                    )}

                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
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
                  </Box>
                )}
              </Box>

              {!loading && !data?.payment && (
                <>
                  <Divider />
                  <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
                    <Stack direction="row" spacing={2}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={submitForm}
                        disabled={isSubmitting}
                        sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 3 }}
                      >
                        {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
                      </Button>
                    </Stack>
                  </Box>
                </>
              )}
            </Form>
          )}
        </Formik>
      </Drawer>

      <FinanceEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        entryId={selectedEntryId}
        onSuccess={() => {
          fetchHistory();
          onSuccess?.();
        }}
        zIndex={3000}
      />
    </>
  );
}
