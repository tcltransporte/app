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

export function DocumentServiceDrawer({ open, onClose, onSave, initialData }) {
  
  const initialValues = {
    id: initialData?.id || null,
    itemId: initialData?.idServico || initialData?.itemId || null,
    service: initialData?.service || null,
    quantity: initialData?.quantity || initialData?.Quantidade || 1,
    value: initialData?.value || initialData?.Valor || 0,
    description: initialData?.description || initialData?.Descricao || ''
  };

  const handleSubmit = (values) => {
    onSave({
      ...values,
      idServico: values.service?.id || values.itemId,
      itemId: values.service?.id || values.itemId,
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
                {initialData?.id || initialData?.tempId ? 'Editar Serviço' : 'Adicionar Serviço'}
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
                      name="service"
                      component={AutoComplete}
                      label="Serviço"
                      fullWidth
                      size="small"
                      text={(item) => item?.name || ''}
                      onSearch={(val, signal) => search.service({ search: val }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.name}</span>
                      )}
                      onChange={(val) => {
                        if (val) {
                          setFieldValue('description', val.name || '');
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
                      label="Descrição / Detalhes"
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
                      <Typography variant="subtitle2" color="text.secondary">Total do Serviço</Typography>
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
