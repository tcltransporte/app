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
import { NumericField, SelectField } from '@/components/controls';

const emptyValues = {
  rowKey: null,
  id: null,
  compositionTypeId: '',
  value: 0
};

function getValues(data) {
  if (!data) return { ...emptyValues };
  return { ...emptyValues, ...data };
}

export function ShipmentCompositionDrawer({
  open,
  composition,
  compositionTypes = [],
  onClose,
  onSave
}) {
  const isEdit = Boolean(composition?.rowKey || composition?.id);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' }
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
        initialValues={getValues(composition)}
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
                    name="compositionTypeId"
                    component={SelectField}
                    label="Tipo de componente"
                    options={compositionTypes.map((ct) => ({
                      value: ct.id,
                      label: ct.description
                    }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={12}>
                  <Field
                    name="value"
                    component={NumericField}
                    label="Valor (R$)"
                    fullWidth
                    size="small"
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
