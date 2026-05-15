'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button, Collapse, Box } from '@mui/material';
import { Save as SaveIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Dialog, FormSection } from '@/components/common';
import UnifiedChip from '@/components/common/UnifiedChip';
import { TextField, AutoComplete, DateField, NumericField, SelectField } from '@/components/controls';
import * as shipmentAction from '@/app/actions/shipment.action';
import * as search from '@/libs/search';
import { alert } from '@/libs/alert';
import { ServiceStatus } from '@/libs/service';
import { ShipmentFreightComposition } from './shipment-freight-composition';
import ShipmentCtesDrawer from './shipment-ctes-drawer';

function partnerText(v) {
  const id = v?.id ?? '';
  const name = v?.surname || v?.name || '';
  const cnpj = v?.cpfCnpj || v?.CpfCnpj || '';
  return `${id} - ${name}${cnpj ? ` - ${cnpj}` : ''}`;
}

function parseDateField(value) {
  if (!value) return null;
  const datePart =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : typeof value === 'string'
        ? value.slice(0, 10)
        : '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapCompositionsToForm(compositions = []) {
  return (compositions || []).map((item, index) => {
    const dbId = Number(item.id);
    const numericId = Number.isFinite(dbId) && dbId > 0 ? dbId : null;
    return {
      rowKey: numericId ? `id-${numericId}` : `row-${index}`,
      id: numericId,
      compositionTypeId: item.compositionTypeId,
      componentDescription: item.compositionType?.description || '',
      value: item.value
    };
  });
}

const emptyValues = {
  customer: null,
  receiver: null,
  expediter: null,
  thirdPartyPayer: null,
  ncm: null,
  tripId: '',
  transportDocumentId: '',
  departureDate: new Date(),
  deliveryDate: null,
  description: '',
  proPred: '',
  paymentTypeId: '',
  icmsCalculationTypeId: '',
  serviceTypeId: '',
  servicePayerTypeId: '',
  refCteKey: '',
  weight: '',
  freightValue: '',
  freightLetterValue: '',
  deliveryQuantity: '',
  originMunicipalityId: '',
  destinationMunicipalityId: '',
  sequenceOrder: '',
  observation: '',
  compositions: []
};

function rowToFormValues(row, ncmOption) {
  if (!row) return { ...emptyValues };
  return {
    customer: row.customer || null,
    receiver: row.receiver || null,
    expediter: row.expediter || null,
    thirdPartyPayer: row.thirdPartyPayer || null,
    ncm: ncmOption || (row.ncmId ? { id: row.ncmId, label: String(row.ncmId) } : null),
    tripId: row.tripId ?? '',
    transportDocumentId: row.transportDocumentId ?? '',
    departureDate: parseDateField(row.departureDate) || new Date(),
    deliveryDate: parseDateField(row.deliveryDate),
    description: row.description || '',
    proPred: row.proPred || '',
    paymentTypeId: row.paymentTypeId ?? '',
    icmsCalculationTypeId: row.icmsCalculationTypeId ?? '',
    serviceTypeId: row.serviceTypeId ?? '',
    servicePayerTypeId: row.servicePayerTypeId ?? '',
    refCteKey: row.refCteKey || '',
    weight: row.weight ?? '',
    freightValue: row.freightValue ?? '',
    freightLetterValue: row.freightLetterValue ?? '',
    deliveryQuantity: row.deliveryQuantity ?? '',
    originMunicipalityId: row.originMunicipalityId ?? '',
    destinationMunicipalityId: row.destinationMunicipalityId ?? '',
    sequenceOrder: row.sequenceOrder ?? '',
    observation: row.observation || '',
    compositions: mapCompositionsToForm(row.compositions)
  };
}

const validate = (values) => {
  const errors = {};
  if (!values.customer) errors.customer = 'Campo obrigatório';
  return errors;
};

function lookupOptions(items = []) {
  return items.map((item) => ({
    value: item.id,
    label: item.description
  }));
}

export default function ShipmentFormModal({ open, shipmentId, onClose, onSuccess }) {
  const isEdit = Boolean(shipmentId);
  const [loading, setLoading] = React.useState(false);
  const [formValues, setFormValues] = React.useState(emptyValues);
  const [lookups, setLookups] = React.useState({
    paymentTypes: [],
    serviceTypes: [],
    servicePayerTypes: [],
    icmsCalculationTypes: [],
    componentTypes: []
  });
  const [showExtra, setShowExtra] = React.useState(false);
  const [ctesCount, setCtesCount] = React.useState(0);
  const [ctesDrawerOpen, setCtesDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const lookupsResult = await shipmentAction.getFormLookups();
        if (lookupsResult?.header?.status === ServiceStatus.SUCCESS && !cancelled) {
          setLookups(lookupsResult.body || {});
        }

        if (!isEdit) {
          if (!cancelled) {
            setFormValues({ ...emptyValues, departureDate: new Date() });
            setCtesCount(0);
          }
          return;
        }

        const result = await shipmentAction.findOne(shipmentId);
        if (result?.header?.status !== ServiceStatus.SUCCESS) {
          throw result;
        }

        let ncmOption = null;
        if (result.body?.ncmId) {
          const ncmResult = await shipmentAction.findNcmById(result.body.ncmId);
          if (ncmResult?.header?.status === ServiceStatus.SUCCESS) {
            ncmOption = ncmResult.body;
          }
        }

        if (!cancelled) {
          setFormValues(rowToFormValues(result.body, ncmOption));
          setCtesCount(Number(result.body?.ctesCount) || 0);
        }
      } catch (error) {
        if (!cancelled) {
          alert.error('Erro', error?.body?.message || error.message || 'Erro ao carregar romaneio');
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, shipmentId, isEdit, onClose]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const freightSum = (values.compositions || []).reduce(
        (sum, row) => sum + (Number(row.value) || 0),
        0
      );

      const payload = {
        customerId: values.customer?.id,
        receiverId: values.receiver?.id ?? null,
        expediterId: values.expediter?.id ?? null,
        thirdPartyPayerId: values.thirdPartyPayer?.id ?? null,
        ncmId: values.ncm?.id ?? null,
        tripId: values.tripId,
        transportDocumentId: values.transportDocumentId,
        departureDate: values.departureDate,
        deliveryDate: values.deliveryDate,
        description: values.description,
        proPred: values.proPred,
        paymentTypeId: values.paymentTypeId,
        icmsCalculationTypeId: values.icmsCalculationTypeId,
        serviceTypeId: values.serviceTypeId,
        servicePayerTypeId: values.servicePayerTypeId,
        refCteKey: values.refCteKey,
        weight: values.weight,
        freightValue: freightSum > 0 ? freightSum : values.freightValue,
        freightLetterValue: values.freightLetterValue,
        deliveryQuantity: values.deliveryQuantity,
        originMunicipalityId: values.originMunicipalityId,
        destinationMunicipalityId: values.destinationMunicipalityId,
        sequenceOrder: values.sequenceOrder,
        observation: values.observation,
        compositions: (values.compositions || []).map((row) => {
          const id = Number(row.id);
          const numericId = Number.isFinite(id) && id > 0 ? id : null;
          return {
            ...(numericId ? { id: numericId } : {}),
            compositionTypeId: row.compositionTypeId,
            value: row.value
          };
        })
      };

      const result = isEdit
        ? await shipmentAction.update(shipmentId, payload)
        : await shipmentAction.create(payload);

      if (result?.header?.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      alert.success('Sucesso', isEdit ? 'Romaneio atualizado com sucesso!' : 'Romaneio criado com sucesso!');
      onSuccess?.(result.body);
      onClose();
    } catch (error) {
      alert.error(
        'Erro',
        error?.body?.message || error.message || (isEdit ? 'Erro ao atualizar romaneio' : 'Erro ao criar romaneio')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const refreshCtesCount = React.useCallback(async () => {
    if (!shipmentId) return;
    try {
      const result = await shipmentAction.findOne(shipmentId);
      if (result?.header?.status === ServiceStatus.SUCCESS) {
        setCtesCount(Number(result.body?.ctesCount) || 0);
      }
    } catch {
      /* ignore */
    }
  }, [shipmentId]);

  const shipmentLabel = React.useMemo(() => {
    const doc = formValues.transportDocumentId;
    return doc ? `Doc. ${doc}` : String(shipmentId || '');
  }, [formValues.transportDocumentId, shipmentId]);

  if (!open) return null;

  const dialogTitle = isEdit ? `Edita carga - ${shipmentId}` : 'Adicionar romaneio';

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      width="1000px"
      loading={loading}
    >
      <Formik
        initialValues={formValues}
        validate={validate}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, setFieldValue }) => {
          const freightSum = (values.compositions || []).reduce(
            (sum, row) => sum + (Number(row.value) || 0),
            0
          );

          return (
            <Form>
              <Dialog.Content>
                <Grid container spacing={1}>

                  {isEdit && (
                    <Grid size={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                        <span title="Ver CT-es da carga">
                          <UnifiedChip
                            label={String(ctesCount)}
                            color={ctesCount > 0 ? 'primary' : 'default'}
                            variant="filled"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCtesDrawerOpen(true);
                            }}
                            chipSx={{
                              cursor: 'pointer',
                              minWidth: 32,
                              boxShadow: (theme) =>
                                ctesCount > 0 ? `0 2px 4px ${theme.palette.primary.main}44` : 'none',
                              '&:hover': {
                                opacity: 0.9,
                                transform: 'scale(1.05)',
                                boxShadow: (theme) =>
                                  ctesCount > 0 ? `0 4px 8px ${theme.palette.primary.main}66` : undefined
                              },
                              transition: 'all 0.2s'
                            }}
                          />
                        </span>
                      </Box>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 2.2 }}>
                    <Field
                      component={TextField}
                      name="transportDocumentId"
                      label="Doc. transporte"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 9.8 }}>
                    <Field
                      component={AutoComplete}
                      name="customer"
                      label="Remetente *"
                      text={partnerText}
                      onSearch={(value, signal) => search.partner({
                        search: value,
                        isCustomer: true,
                        isSupplier: true
                      }, signal)}
                      renderSuggestion={partnerText}
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3.5 }}>
                    <Field
                      component={TextField}
                      name="proPred"
                      label="Produto predominante"
                      fullWidth
                      size="small"
                      inputProps={{ maxLength: 60 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3.5 }}>
                    <Field
                      component={AutoComplete}
                      name="ncm"
                      label="NCM"
                      text={(item) => item?.label || ''}
                      onSearch={async (value, signal) => {
                        const result = await shipmentAction.searchNcm(value);
                        if (result?.header?.status !== ServiceStatus.SUCCESS) return [];
                        return result.body || [];
                      }}
                      renderSuggestion={(item) => item?.label || ''}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <Field
                      component={SelectField}
                      name="paymentTypeId"
                      label="Forma pagamento"
                      options={lookupOptions(lookups.paymentTypes)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <Field
                      component={SelectField}
                      name="icmsCalculationTypeId"
                      label="Fórmula cálculo ICMS"
                      options={lookupOptions(lookups.icmsCalculationTypes)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <Field
                      component={TextField}
                      name="description"
                      label="Descrição"
                      fullWidth
                      size="small"
                      inputProps={{ maxLength: 60 }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <ShipmentFreightComposition
                      components={values.compositions}
                      componentTypes={lookups.componentTypes}
                      freightValue={freightSum > 0 ? freightSum : values.freightValue}
                      freightLetterValue={values.freightLetterValue}
                      onChangeComponents={(next) => setFieldValue('compositions', next)}
                      onFreightLetterValueChange={(val) => setFieldValue('freightLetterValue', val ?? '')}
                    />
                  </Grid>

                  <Grid size={12}>
                    <FormSection title="Serviço">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={SelectField}
                            name="serviceTypeId"
                            label="Tipo serviço"
                            options={lookupOptions(lookups.serviceTypes)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={AutoComplete}
                            name="expediter"
                            label="Expedidor"
                            text={partnerText}
                            onSearch={(value, signal) => search.partner({ search: value }, signal)}
                            renderSuggestion={partnerText}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={AutoComplete}
                            name="receiver"
                            label="Recebedor"
                            text={partnerText}
                            onSearch={(value, signal) => search.partner({ search: value }, signal)}
                            renderSuggestion={partnerText}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={SelectField}
                            name="servicePayerTypeId"
                            label="Tomador serviço"
                            options={lookupOptions(lookups.servicePayerTypes)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={AutoComplete}
                            name="thirdPartyPayer"
                            label="Tomador outros"
                            text={partnerText}
                            onSearch={(value, signal) => search.partner({ search: value }, signal)}
                            renderSuggestion={partnerText}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={TextField}
                            name="refCteKey"
                            label="Chave CT-e"
                            fullWidth
                            size="small"
                            inputProps={{ maxLength: 44 }}
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  </Grid>

                  {/*
                  <Grid size={12}>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setShowExtra((v) => !v)}
                      startIcon={showExtra ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Dados adicionais do romaneio
                    </Button>
                    <Collapse in={showExtra}>
                      <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Field
                            component={NumericField}
                            name="tripId"
                            label="Viagem"
                            fullWidth
                            size="small"
                            precision={0}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Field
                            component={DateField}
                            name="departureDate"
                            label="Data de saída"
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Field
                            component={DateField}
                            name="deliveryDate"
                            label="Data de entrega"
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={NumericField}
                            name="weight"
                            label="Peso"
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={NumericField}
                            name="deliveryQuantity"
                            label="Qtd. entregas"
                            fullWidth
                            size="small"
                            precision={0}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Field
                            component={NumericField}
                            name="sequenceOrder"
                            label="Ordem"
                            fullWidth
                            size="small"
                            precision={0}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Field
                            component={NumericField}
                            name="originMunicipalityId"
                            label="Cód. município origem"
                            fullWidth
                            size="small"
                            precision={0}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Field
                            component={NumericField}
                            name="destinationMunicipalityId"
                            label="Cód. município destino"
                            fullWidth
                            size="small"
                            precision={0}
                          />
                        </Grid>
                        <Grid size={12}>
                          <Field
                            component={TextField}
                            name="observation"
                            label="Observação"
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            inputProps={{ maxLength: 300 }}
                          />
                        </Grid>
                      </Grid>
                    </Collapse>
                  </Grid>
                  */}

                </Grid>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting ? null : <SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </Dialog.Actions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>

    {isEdit && (
      <ShipmentCtesDrawer
        open={ctesDrawerOpen}
        shipmentId={shipmentId}
        shipmentLabel={shipmentLabel}
        onClose={() => setCtesDrawerOpen(false)}
        onCtesChanged={refreshCtesCount}
      />
    )}
    </>
  );
}
