'use client';

import React from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Drawer,
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import {
  TextField,
  NumericField,
  AutoComplete
} from '@/components/controls';
import * as search from "@/libs/search";

export function DocumentProductDrawer({ open, onClose, onSave, initialData }) {
  
  const initialValues = {
    id: initialData?.id || null,
    itemId: initialData?.itemId || null,
    product: initialData?.product || null,
    quantity: initialData?.quantity || 1,
    value: initialData?.value || 0,
    description: initialData?.description || ''
  };

  const handleSubmit = (values) => {
    onSave({
      ...values,
      itemId: values.product?.id || values.itemId,
      // Ensure numeric values
      quantity: Number(values.quantity),
      value: Number(values.value)
    });
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, p: 0 }
      }}
    >
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ submitForm, setFieldValue, values }) => (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>
                {initialData?.id || initialData?.tempId ? 'Editar Item' : 'Adicionar Item'}
              </Typography>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />

            {/* Content */}
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
              <Form>
                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12 }}>
                    <Field
                      name="product"
                      component={AutoComplete}
                      label="Produto / Item"
                      fullWidth
                      size="small"
                      text={(item) => item?.description || ''}
                      onSearch={(val, signal) => search.product({ search: val }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.description}</span>
                      )}
                      onChange={(val) => {
                        if (val) {
                          setFieldValue('description', val.description || '');
                          setFieldValue('value', val.value || 0);
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <Field
                      name="quantity"
                      component={NumericField}
                      label="Quantidade"
                      fullWidth
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <Field
                      name="value"
                      component={NumericField}
                      label="Valor Unitário (R$)"
                      fullWidth
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <Field
                      name="description"
                      component={TextField}
                      label="Descrição Adicional"
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Grid>
                  
                  <Grid item size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="subtitle2" color="text.secondary">Total do Item</Typography>
                      <Typography variant="h6" fontWeight={800} color="primary">
                        R$ {(Number(values.quantity || 0) * Number(values.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            </Box>

            <Divider />
            {/* Footer */}
            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
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
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Confirmar
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Formik>
    </Drawer>
  );
}
