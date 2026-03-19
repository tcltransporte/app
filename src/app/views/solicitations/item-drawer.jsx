'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, Grid } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField, AutoComplete, NumericField } from '@/components/controls';
import * as search from '@/libs/search';

/**
 * Drawer for adding or editing items (pieces/services).
 */
export function ItemDrawer({
  open,
  onClose,
  initialValues,
  onSave,
  title = 'Produto'
}) {
  const formikRef = React.useRef(null);
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 }, p: 0 }
      }}
      // Z-index higher than the dialog
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Formik
          innerRef={formikRef}
          initialValues={initialValues || {}}
          enableReinitialize
          onSubmit={(values) => {
            onSave(values);
            onClose();
          }}
        >
          {({ submitForm, setFieldValue }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Field
                      component={AutoComplete}
                      name="product"
                      label={title === 'Produto' ? "Produto" : "Serviço"}
                      fullWidth
                      size="small"
                      text={(item) => item?.description || item?.name || item?.surname || ''}
                      onSearch={(value, signal) => title === 'Produto' ? search.product({ search: value }, signal) : search.service({ search: value }, signal)}
                      renderSuggestion={(item) => (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight={600}>{item?.name || item?.surname || item?.description}</Typography>
                          {item?.productCode && (
                            <Typography variant="caption" color="text.secondary">Código: {item.productCode}</Typography>
                          )}
                        </Box>
                      )}
                      onChange={(item, form) => {
                        // When item changes, we might want to update itemId and value
                        if (item) {
                          form.setFieldValue('itemId', item.id);
                          if (item.defaultPrice) form.setFieldValue('value', item.defaultPrice);
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Field
                      component={NumericField}
                      name="quantity"
                      label="Quantidade"
                      precision={3}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Field
                      component={NumericField}
                      name="value"
                      label="Valor"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
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
                  Salvar
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Drawer>
  );
}
