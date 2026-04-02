'use client';

import React from 'react';
import {
  Button,
  Grid,
} from '@mui/material';
import { Dialog } from '@/components/common';
import { Formik, Form, Field } from 'formik';
import {
  TextField,
  NumericField,
  DateField,
  AutoComplete,
  SelectField
} from '@/components/controls';
import * as search from '@/libs/search';

export function FreightLetterDetail({ open, freightLetter, componentTypes = [], onClose, onSave }) {

  const initialValues = {
    id: null,
    freightLetterComponentTypeId: '',
    value: 0,
    discountValue: 0,
    operatorProtocol: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    payeeId: null,
    payee: null,
    cardNumber: '',
    tripId: null,
    tripTravelId: null,
    solicitationId: null,
  };

  const getValues = (data) => ({
    ...initialValues,
    ...data,
    effectiveDate: data?.effectiveDate ? new Date(data.effectiveDate).toISOString().split('T')[0] : initialValues.effectiveDate,
  });

  const handleSubmit = (values) => {
    onSave?.(values);
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Componente de Carta Frete"
      width="md"
    >
      <Formik
        initialValues={getValues(freightLetter)}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ submitForm, values }) => (
          <>
            <Dialog.Content dividers>
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      name="freightLetterComponentTypeId"
                      component={SelectField}
                      label="Tipo de Componente"
                      options={componentTypes.map(ct => ({ value: ct.id, label: ct.description }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      name="payee"
                      component={AutoComplete}
                      label="Favorecido"
                      fullWidth
                      text={(item) => item?.surname || item?.name || ''}
                      onSearch={(val, signal) => search.partner({ search: val }, signal)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field
                      name="value"
                      component={NumericField}
                      label="Valor (R$)"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field
                      name="discountValue"
                      component={NumericField}
                      label="Desconto (R$)"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field
                      name="effectiveDate"
                      component={DateField}
                      label="Data Efetivação"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      name="operatorProtocol"
                      component={TextField}
                      label="Protocolo / Referência"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      name="cardNumber"
                      component={TextField}
                      label="Número do Cartão"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field
                      name="description"
                      component={TextField}
                      label="Observações"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Form>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
                Cancelar
              </Button>
              <Button
                onClick={submitForm}
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                Salvar
              </Button>
            </Dialog.Actions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}
