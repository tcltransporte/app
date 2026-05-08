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
  Button,
  Checkbox,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Formik, Form, Field, FieldArray } from 'formik';
import { AutoComplete, DateField, NumericField, SelectField, CheckField } from '@/components/controls';
import * as paymentAction from '@/app/actions/payment.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import * as search from '@/libs/search';
import FinanceEntryModal from './finance-entry-modal';

function cloneBankAccount(acc) {
  if (!acc || typeof acc !== 'object') return acc ?? null;
  return { ...acc };
}

function prefsFromFormValues(formValues) {
  const items = formValues?.items;
  if (!items?.length) return null;

  const coalesceDate = (d) => {
    const dt = d instanceof Date ? d : d ? new Date(d) : new Date();
    return Number.isNaN(dt.getTime()) ? new Date() : dt;
  };

  if (items.length > 1) {
    return {
      globalPaymentMethodId: formValues.globalPaymentMethodId ?? '',
      globalBankAccount: cloneBankAccount(formValues.globalBankAccount),
      globalRealDate: coalesceDate(formValues.globalRealDate),
      globalIsReconciled: !!formValues.globalIsReconciled,
    };
  }

  const c0 = items[0]?.composition?.[0];
  if (!c0) return null;
  return {
    globalPaymentMethodId: c0.paymentMethodId ?? '',
    globalBankAccount: cloneBankAccount(c0.bankAccountId),
    globalRealDate: coalesceDate(c0.realDate),
    globalIsReconciled: !!c0.isReconciled,
  };
}

function StashBaixaDraftOnEdit({ open, loading, values, stashDraft }) {
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (!open || loading || !values.items?.length) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      stashDraft(values);
      timerRef.current = null;
    }, 300);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, loading, values, stashDraft]);
  return null;
}

const validatePayment = (values) => {
  const errors = {};
  const itemErrors = values.items.map((item) => {
    const error = {};
    const totalComp = item.composition.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    if (Math.abs(totalComp - item.value) > 0.01) {
      error.compositionMessage = 'Valor incompleto';
    }

    const compErrors = item.composition.map((c) => {
      const e = {};
      if (!c.paymentMethodId) e.paymentMethodId = 'Obrigatório';
      if (!c.bankAccountId) e.bankAccountId = 'Obrigatório';
      return Object.keys(e).length > 0 ? e : null;
    });

    if (compErrors.some((e) => e !== null)) error.composition = compErrors;
    return Object.keys(error).length > 0 ? error : null;
  });

  if (itemErrors.some((e) => e !== null)) errors.items = itemErrors;
  return errors;
};

const InstallmentRow = ({ item, index, formData, handleSearch, textFn }) => {
  const [expanded, setExpanded] = React.useState(true);
  const totalInformadoRow = item.composition.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const isDivergent = Math.abs(totalInformadoRow - item.value) > 0.01;
  const hasRemoveColumn = item.composition.length > 1;

  return (
    <>
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
            <Table size="small" sx={{ width: '100%', tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.5, px: 0.75 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 1.5, width: 64 }}>Conc.</TableCell>
                  <TableCell sx={{ width: '18%' }}>Data Pgto</TableCell>
                  <TableCell sx={{ width: '22%' }}>Forma</TableCell>
                  <TableCell>Conta Bancária</TableCell>
                  <TableCell align="right" sx={{ width: '16%', pr: 0.5, textAlign: 'right' }}>Valor</TableCell>
                  {hasRemoveColumn && <TableCell width={40} />}
                </TableRow>
              </TableHead>
              <TableBody>
                <FieldArray name={`items.${index}.composition`}>
                  {({ push, remove }) => (
                    <>
                      {item.composition.map((comp, cIdx) => (
                        <TableRow key={cIdx}>
                          <TableCell sx={{ pl: 2, pr: 1 }}>
                            <Field name={`items.${index}.composition.${cIdx}.isReconciled`} component={CheckField} label="" />
                          </TableCell>
                          <TableCell sx={{ px: 0.5 }}>
                            <Field name={`items.${index}.composition.${cIdx}.realDate`} component={DateField} size="small" fullWidth />
                          </TableCell>
                          <TableCell sx={{ px: 0.5 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.paymentMethodId`}
                              component={SelectField}
                              options={formData.methods.map((m) => ({ value: m.id, label: m.description }))}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ px: 0.5 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.bankAccountId`}
                              component={AutoComplete}
                              onSearch={handleSearch}
                              text={textFn}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ pl: 0.5, pr: 0 }}>
                            <Field
                              name={`items.${index}.composition.${cIdx}.value`}
                              component={NumericField}
                              size="small"
                              fullWidth
                              sx={{ '& input': { textAlign: 'right' } }}
                            />
                          </TableCell>
                          {hasRemoveColumn && (
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => remove(cIdx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={hasRemoveColumn ? 6 : 5} sx={{ p: 0.5 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              push({
                                value: 0,
                                paymentMethodId: item.composition[0]?.paymentMethodId ?? '',
                                bankAccountId: item.composition[0]?.bankAccountId ?? null,
                                realDate: item.composition[0]?.realDate ?? null,
                                isReconciled: !!item.composition[0]?.isReconciled,
                                description: '',
                              })
                            }
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', ml: 1 }}
                          >
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </FieldArray>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default function FinanceSettlementDrawer({ entryIds, open, onClose, onSuccess, zIndex }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [formData, setFormData] = React.useState({ methods: [] });
  const [selectedEntryId, setSelectedEntryId] = React.useState(null);
  const [entryModalOpen, setEntryModalOpen] = React.useState(false);
  const formikRef = React.useRef(null);
  const lastBaixaDraftRef = React.useRef(null);

  const stashDraft = React.useCallback((formValues) => {
    const p = prefsFromFormValues(formValues);
    if (p) lastBaixaDraftRef.current = p;
  }, []);

  const rememberAndClose = React.useCallback(() => {
    const v = formikRef.current?.values;
    if (v?.items?.length) stashDraft(v);
    onClose?.();
  }, [onClose, stashDraft]);

  const handleOpenEntry = (id) => {
    setSelectedEntryId(id);
    setEntryModalOpen(true);
    onClose?.();
  };

  const fetchSettlementData = React.useCallback(async () => {
    const ids = (Array.isArray(entryIds) ? entryIds : [entryIds])
      .filter(Boolean)
      .map((item) => (typeof item === 'object' && item !== null ? item.id : item))
      .map(Number)
      .filter((id) => !Number.isNaN(id));

    if (ids.length === 0) return;

    setLoading(true);
    try {
      const result = await paymentAction.fetchHistory(ids);
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw new Error(result.body?.message || 'Erro ao buscar dados da baixa');
      }

      const settlementData = result.body;
      if (settlementData?.payment) {
        throw new Error('As parcelas selecionadas já possuem baixa registrada.');
      }

      setData(settlementData);
      setFormData({ methods: settlementData.methods || [] });
    } catch (error) {
      alert.error('Erro!', error?.message || 'Não foi possível carregar as informações das parcelas para baixa.');
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [entryIds, onClose]);

  React.useEffect(() => {
    if (open) {
      fetchSettlementData();
    } else {
      setData(null);
    }
  }, [open, fetchSettlementData]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await paymentAction.executePayment({
        settlements: values.items.map((item) => ({
          entryId: item.entryId,
          composition: item.composition.map((c) => ({
            ...c,
            bankAccountId: c.bankAccountId?.id || c.bankAccountId
          }))
        })),
        commonData: {}
      });

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      stashDraft(values);
      alert.success('Sucesso', 'Pagamento realizado com sucesso!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const textFnGlobal = React.useCallback((v) =>
    (v && typeof v === 'object') ? (v.description || v.bankName || '') : '',
  []);

  const handleSearchGlobal = React.useCallback(
    (value, signal) => search.bankAccount({ search: value }, signal),
    []
  );

  const handleGlobalChange = (field, value, setFieldValue, currentValues) => {
    const newItems = currentValues.items.map((item) => {
      switch (field) {
        case 'paymentMethodId':
          return { ...item, composition: item.composition.map((c) => ({ ...c, paymentMethodId: value })) };
        case 'bankAccount':
          return { ...item, composition: item.composition.map((c) => ({ ...c, bankAccountId: value })) };
        case 'realDate':
          return { ...item, composition: item.composition.map((c) => ({ ...c, realDate: value })) };
        case 'isReconciled':
          return { ...item, composition: item.composition.map((c) => ({ ...c, isReconciled: !!value })) };
        default:
          return item;
      }
    });
    setFieldValue('items', newItems);
  };

  const initialValues = React.useMemo(() => {
    if (!data) return { items: [] };

    const saved = lastBaixaDraftRef.current;
    const fromPrefs = saved
      ? {
        paymentMethodId: saved.globalPaymentMethodId,
        bankAccountId: saved.globalBankAccount ?? null,
        realDate: saved.globalRealDate instanceof Date && !Number.isNaN(saved.globalRealDate.getTime()) ? saved.globalRealDate : new Date(),
        isReconciled: saved.globalIsReconciled ?? false,
      }
      : {
        paymentMethodId: '',
        bankAccountId: null,
        realDate: new Date(),
        isReconciled: false,
      };

    return {
      globalPaymentMethodId: fromPrefs.paymentMethodId,
      globalBankAccount: fromPrefs.bankAccountId,
      globalRealDate: fromPrefs.realDate,
      globalIsReconciled: fromPrefs.isReconciled,
      items: (data.selectedEntries || []).map((entry) => ({
        entryId: entry.id,
        value: Number(entry.installmentValue) || 0,
        installmentNumber: entry.installmentNumber,
        documentNumber: entry.title?.documentNumber || '',
        personName: entry.title?.partner?.name || entry.title?.partner?.surname || 'N/A',
        dueDate: entry.dueDate,
        composition: [{
          value: Number(entry.installmentValue) || 0,
          paymentMethodId: fromPrefs.paymentMethodId,
          bankAccountId: fromPrefs.bankAccountId,
          realDate: fromPrefs.realDate,
          isReconciled: fromPrefs.isReconciled,
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
        onClose={rememberAndClose}
        sx={{ zIndex: zIndex || ((theme) => theme.zIndex.modal + 2) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 900 }, display: 'flex', flexDirection: 'column' } }}
      >
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validate={validatePayment}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, isSubmitting, setFieldValue, submitForm }) => {
            const totalSelectedValue = (values.items || []).reduce(
              (sum, item) => sum + (Number(item?.value) || 0),
              0
            );

            return (
            <>
              <StashBaixaDraftOnEdit open={open} loading={loading} values={values} stashDraft={stashDraft} />
              <Form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptIcon />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {loading ? 'Carregando...' : `Baixar Títulos: ${data?.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || ''}`}
                    </Typography>
                  </Stack>
                  <IconButton onClick={rememberAndClose} size="small" sx={{ color: 'inherit' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0, position: 'relative', bgcolor: 'background.default' }}>
                  {loading ? (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Buscando informações...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.5 }}>
                      {values.items.length > 1 && (
                        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 1.5 }}>
                          <Box
                            sx={{
                              display: 'grid',
                              // Mesma régua dos campos por título:
                              // Conc.(64px) | Data(18%) | Forma(22%) | Conta(+ espaço do Valor)
                              gridTemplateColumns: { xs: '1fr', sm: '64px 18% 22% minmax(0, 1fr)' },
                              gap: 0.75,
                              alignItems: 'center'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25 }}>
                                Conc.
                              </Typography>
                              <Checkbox
                                size="small"
                                checked={Boolean(values.globalIsReconciled)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFieldValue('globalIsReconciled', checked);
                                  handleGlobalChange('isReconciled', checked, setFieldValue, values);
                                }}
                                sx={{ p: 0.5, mt: -0.25 }}
                              />
                            </Box>
                            <Field
                              name="globalRealDate"
                              component={DateField}
                              label="Data Pgto"
                              fullWidth
                              onChange={(val) => handleGlobalChange('realDate', val, setFieldValue, values)}
                            />
                            <Field
                              name="globalPaymentMethodId"
                              component={SelectField}
                              label="Forma"
                              options={formData.methods.map((m) => ({ value: m.id, label: m.description }))}
                              fullWidth
                              onChange={(val) => handleGlobalChange('paymentMethodId', val, setFieldValue, values)}
                            />
                            <Field
                              name="globalBankAccount"
                              component={AutoComplete}
                              label="Conta"
                              onSearch={handleSearchGlobal}
                              text={textFnGlobal}
                              fullWidth
                              onChange={(val) => handleGlobalChange('bankAccount', val, setFieldValue, values)}
                            />
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.5, px: 0.75 } }}>
                          <TableBody>
                            {values.items.map((item, index) => (
                              <InstallmentRow
                                key={item.entryId}
                                item={item}
                                index={index}
                                formData={formData}
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

                {!loading && (
                  <>
                    <Divider />
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'action.hover',
                        borderTop: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Valor total selecionado
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {totalSelectedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Stack direction="row" spacing={2}>
                        <Button fullWidth variant="outlined" onClick={rememberAndClose} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancelar</Button>
                        <Button fullWidth variant="contained" onClick={submitForm} disabled={isSubmitting} sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 3 }}>
                          {isSubmitting ? 'Processando...' : 'Confirmar'}
                        </Button>
                      </Stack>
                    </Box>
                  </>
                )}
              </Form>
            </>
          );
          }}
        </Formik>
      </Drawer>

      <FinanceEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        entryId={selectedEntryId}
        onSuccess={() => {
          fetchSettlementData();
          onSuccess?.();
        }}
        zIndex={3000}
      />
    </>
  );
}

