'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Grid
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import {
  TextField,
  NumericField,
  DateField,
  AutoComplete,
  SelectField
} from '@/components/controls';
import * as search from '@/libs/search';

function toDateInput(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  if (value instanceof Date) return value.toISOString().split('T')[0];
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : new Date().toISOString().split('T')[0];
}

const emptyValues = {
  rowKey: null,
  id: null,
  freightLetterComponentTypeId: '',
  value: 0,
  discountValue: 0,
  operatorProtocol: '',
  description: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  payeeId: null,
  payee: null,
  cardNumber: ''
};

function getValues(data) {
  if (!data) return { ...emptyValues };
  return {
    ...emptyValues,
    ...data,
    effectiveDate: toDateInput(data.effectiveDate)
  };
}

export function ShipmentFreightLetterDrawer({
  open,
  freightLetter,
  componentTypes = [],
  onClose,
  onSave
}) {
  const isEdit = Boolean(freightLetter?.rowKey || freightLetter?.id);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 480 }, display: 'flex', flexDirection: 'column' }
      }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          {isEdit ? 'Editar componente' : 'Adicionar componente'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Formik
        initialValues={getValues(freightLetter)}
        enableReinitialize
        onSubmit={(values) => {
          onSave?.(values);
          onClose?.();
        }}
      >
        {({ submitForm }) => (
          <Form style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Field
                    name="freightLetterComponentTypeId"
                    component={SelectField}
                    label="Tipo de componente"
                    options={componentTypes.map((ct) => ({
                      value: ct.id,
                      label: ct.description
                    }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="payee"
                    component={AutoComplete}
                    label="Favorecido"
                    fullWidth
                    size="small"
                    text={(item) => item?.surname || item?.name || ''}
                    onSearch={(val, signal) => search.partner({ search: val }, signal)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field
                    name="value"
                    component={NumericField}
                    label="Valor (R$)"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field
                    name="discountValue"
                    component={NumericField}
                    label="Desconto (R$)"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="effectiveDate"
                    component={DateField}
                    label="Data efetivação"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="operatorProtocol"
                    component={TextField}
                    label="Protocolo / referência"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="cardNumber"
                    component={TextField}
                    label="Número do cartão"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="description"
                    component={TextField}
                    label="Observações"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                onClick={onClose}
                color="inherit"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={submitForm}
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                Salvar
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Drawer>
  );
}
