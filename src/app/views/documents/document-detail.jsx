'use client';

import React from 'react';
import {
  Button,
  Divider,
  Typography,
  Grid,
} from '@mui/material';
import { Dialog } from '@/components/common';
import { Formik, Form, Field } from 'formik';
import * as documentService from '@/app/services/document.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import {
  TextField,
  NumericField,
  DateField,
  SelectField,
  DateTimeField
} from '@/components/controls';

export function DocumentDetail({ documentId, onClose, onSave, initialData, documentType }) {

  const [data, setData] = React.useState(initialData || {});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!documentId) {
      setData(initialData || {});
      return;
    }

    setLoading(true);
    documentService.findOne(documentId)
      .then(result => {
        console.log(result)
        if (result.status === ServiceStatus.SUCCESS) {
          setData(result);
        } else {
          alert.error('Erro', result.message || 'Erro ao carregar documento');
        }
      })
      .catch(err => alert.error('Erro', 'Ocorreu um erro inesperado'))
      .finally(() => setLoading(false));
  }, [documentId, initialData]);


  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;
      const payload = {
        ...values,
        documentModelId: values.documentTypeId || documentId ? undefined : documentType?.id
      };

      if (documentId) {
        result = await documentService.update(documentId, values);
      } else {
        result = await documentService.create(payload);
      }

      if (result.status === ServiceStatus.SUCCESS) {
        alert.success(documentId ? 'Documento atualizado com sucesso' : 'Documento criado com sucesso');
        onSave?.(result);
        onClose?.();
      } else {
        alert.error('Erro ao salvar', result.message);
      }
    } catch (err) {
      alert.error('Erro', 'Erro ao salvar documento');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = {
    id: null,
    documentTypeId: '',
    invoiceNumber: 0,
    invoiceSeries: '',
    invoiceDate: '',
    receiptDate: '',
    invoiceKey: '',
    invoiceValue: 0,
    totalProductsValue: 0,
    discountValue: 0,
    freightValue: 0,
    insuranceValue: 0,
    otherValues: 0,
    icmsBaseValue: 0,
    icmsValue: 0,
    ipiValue: 0,
    pisValue: 0,
    cofinsValue: 0,
    icmsstBaseValue: 0,
    icmsstValue: 0,
    description: '',
  };

  const getValues = (data) => ({
    ...initialValues,
    ...data,
    id: data?.id || null,
    invoiceDate: data?.invoiceDate ? data.invoiceDate.split('T')[0] : '',
    receiptDate: data?.receiptDate ? data.receiptDate.split('T')[0] : '',
    invoiceNumber: data?.invoiceNumber || 0,
    invoiceValue: data?.invoiceValue || 0,
    totalProductsValue: data?.totalProductsValue || 0,
    discountValue: data?.discountValue || 0,
    freightValue: data?.freightValue || 0,
    insuranceValue: data?.insuranceValue || 0,
    otherValues: data?.otherValues || 0,
    icmsBaseValue: data?.icmsBaseValue || 0,
    icmsValue: data?.icmsValue || 0,
    ipiValue: data?.ipiValue || 0,
    pisValue: data?.pisValue || 0,
    cofinsValue: data?.cofinsValue || 0,
    icmsstBaseValue: data?.icmsstBaseValue || 0,
    icmsstValue: data?.icmsstValue || 0,
  });

  return (
    <Formik
      initialValues={getValues(data)}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ submitForm }) => (
        <Dialog
          open={documentId !== undefined}
          onClose={onClose}
          title="Documento"
          loading={loading && !Object.keys(data).length}
          width="1000px"
        >
          <Dialog.Content>
            <Form>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary">Informações Básicas</Typography>
                </Grid>
                <Grid size={{ xs: 8, sm: 1.5 }}>
                  <Field
                    name="invoiceNumber"
                    component={TextField}
                    label="Número"
                    type="number"
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 1.1 }}>
                  <Field
                    name="invoiceSeries"
                    component={TextField}
                    label="Série"
                    transform="uppercase"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5.4 }}>
                  <Field
                    name="invoiceKey"
                    component={TextField}
                    label="Chave de acesso"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2.2 }}>
                  <Field
                    name="invoiceDate"
                    component={DateTimeField}
                    label="Data Emissão"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.8 }}>
                  <Field
                    name="receiptDate"
                    component={DateField}
                    label="Data Entrada"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">Valores e Totais</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="invoiceValue"
                    component={NumericField}
                    label="Valor Total (R$)"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="totalProductsValue"
                    component={NumericField}
                    label="Total Produtos"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="discountValue"
                    component={NumericField}
                    label="Descontos"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="freightValue"
                    component={NumericField}
                    label="Frete"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="insuranceValue"
                    component={NumericField}
                    label="Seguro"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <Field
                    name="otherValues"
                    component={NumericField}
                    label="Outras Despesas"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">Impostos</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 1.8 }}>
                  <Field
                    name="icmsBaseValue"
                    component={NumericField}
                    label="Base ICMS"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="icmsValue"
                    component={NumericField}
                    label="Valor ICMS"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="ipiValue"
                    component={NumericField}
                    label="Valor IPI"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="pisValue"
                    component={NumericField}
                    label="Valor PIS"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="cofinsValue"
                    component={NumericField}
                    label="Valor COFINS"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="icmsstBaseValue"
                    component={NumericField}
                    label="Base ICMS ST"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.7 }}>
                  <Field
                    name="icmsstValue"
                    component={NumericField}
                    label="Valor ICMS ST"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Field
                    name="description"
                    component={TextField}
                    label="Observações"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Form>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
            <Button
              onClick={submitForm}
              variant="contained"
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {loading && Object.keys(data).length ? 'Salvando...' : 'Salvar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      )}
    </Formik>
  );
}

