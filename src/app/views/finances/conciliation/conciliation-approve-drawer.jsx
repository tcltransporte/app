'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, Grid } from '@mui/material';
import { Close as CloseIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { AutoComplete, DateField } from '@/components/controls';
import * as search from '@/libs/search';

function validate(values) {
  const errors = {};
  if (!values.realDate) errors.realDate = 'Obrigatório';
  if (!values.bankAccount) errors.bankAccount = 'Obrigatório';
  return errors;
}

export default function ConciliationApproveDrawer({ open, movement, selectedCount = 1, onClose, onConfirm, loading = false }) {
  const initialValues = {
    realDate: movement?.realDate ? new Date(movement.realDate) : new Date(),
    bankAccount: movement?.bankAccount || null
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 0 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh / var(--app-zoom, 1))' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            Aprovar Conciliação{selectedCount > 1 ? ` (${selectedCount})` : ''}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validate={validate}
          onSubmit={(values, { setSubmitting }) => {
            Promise.resolve(onConfirm?.(values)).finally(() => setSubmitting(false));
          }}
        >
          {({ isSubmitting }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Field
                      name="realDate"
                      component={DateField}
                      label="Data Pgto"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <Field
                      name="bankAccount"
                      component={AutoComplete}
                      label="Conta Bancária"
                      text={(v) => `${v?.description || ''} (${v?.bankName || ''})`}
                      onSearch={(value, signal) => search.bankAccount({ search: value }, signal)}
                      renderSuggestion={(v) => `${v?.description || ''} (${v?.bankName || ''})`}
                      fullWidth
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
                  disabled={isSubmitting || loading}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  disabled={isSubmitting || loading}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Confirmar
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Drawer>
  );
}
