'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Typography,
  Grid,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { 
  TextField, 
  NumericField, 
  DateField, 
  SelectField 
} from '@/components/controls';

export function DocumentDetail({ open, onClose, onSave, documentTypes, initialData }) {
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalhamento do Documento</DialogTitle>
      <Formik
        initialValues={getValues(initialData)}
        enableReinitialize
        onSubmit={(values) => onSave(values)}
      >
        {({ submitForm }) => (
          <>
            <DialogContent dividers>
              <Form>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary">Informações Básicas</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field
                  name="documentTypeId"
                  component={SelectField}
                  label="Modelo do Documento"
                  options={documentTypes.map(dt => ({ value: dt.id, label: dt.description }))}
                />
              </Grid>
              <Grid size={{ xs: 8, sm: 4 }}>
                <Field
                  name="invoiceNumber"
                  component={TextField}
                  label="Número da NF"
                  type="number"
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 2 }}>
                <Field
                  name="invoiceSeries"
                  component={TextField}
                  label="Série"
                  transform="uppercase"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field
                  name="invoiceKey"
                  component={TextField}
                  label="Chave da NF-e"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="invoiceDate"
                  component={DateField}
                  label="Data Emissão"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
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
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="invoiceValue"
                  component={NumericField}
                  label="Valor Total (R$)"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="totalProductsValue"
                  component={NumericField}
                  label="Total Produtos"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="discountValue"
                  component={NumericField}
                  label="Descontos"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="freightValue"
                  component={NumericField}
                  label="Frete"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="insuranceValue"
                  component={NumericField}
                  label="Seguro"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
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
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="icmsBaseValue"
                  component={NumericField}
                  label="Base ICMS"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="icmsValue"
                  component={NumericField}
                  label="Valor ICMS"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="ipiValue"
                  component={NumericField}
                  label="Valor IPI"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="pisValue"
                  component={NumericField}
                  label="Valor PIS"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="cofinsValue"
                  component={NumericField}
                  label="Valor COFINS"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field
                  name="icmsstBaseValue"
                  component={NumericField}
                  label="Base ICMS ST"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
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
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={onClose} variant="outlined">Cancelar</Button>
              <Button onClick={submitForm} variant="contained">Salvar</Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}
