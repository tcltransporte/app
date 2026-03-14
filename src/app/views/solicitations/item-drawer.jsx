'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, Grid } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField } from '@/components/controls';

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
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, p: 0 }
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
          initialValues={initialValues || {}}
          enableReinitialize
          onSubmit={(values) => {
            onSave(values);
            onClose();
          }}
        >
          {({ submitForm }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Field 
                      component={TextField} 
                      name="itemId" 
                      label="ID Item Estoque" 
                      fullWidth 
                      size="small" 
                      type="number"
                    />
                  </Grid>
                  <Grid size={6}>
                    <Field 
                      component={TextField} 
                      name="quantity" 
                      label="Quantidade" 
                      fullWidth 
                      size="small" 
                      type="number"
                    />
                  </Grid>
                  <Grid size={6}>
                    <Field 
                      component={TextField} 
                      name="value" 
                      label="Valor" 
                      fullWidth 
                      size="small" 
                      type="number"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Field 
                      component={TextField} 
                      name="vehicleId" 
                      label="ID Veículo" 
                      fullWidth 
                      size="small" 
                      type="number"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Field 
                      component={TextField} 
                      name="supplierId" 
                      label="ID Fornecedor" 
                      fullWidth 
                      size="small" 
                      type="number"
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
