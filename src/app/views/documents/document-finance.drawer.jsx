'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field, useFormikContext } from 'formik';
import { TextField, SelectField, NumericField } from '@/components/controls';

/**
 * Internal component to handle installment generation logic based on form values.
 */
const InstallmentsLogic = () => {
  const { values, setFieldValue } = useFormikContext();

  const { isEdit } = values;
  React.useEffect(() => {
    if (isEdit) return; // Don't auto-generate if editing one specifically

    const count = parseInt(values.installmentsCount) || 0;
    const total = parseFloat(values.totalValue) || 0;
    const baseDate = values.baseDueDate ? new Date(values.baseDueDate) : new Date();

    if (count > 0 && total > 0) {
      const perInstallment = (total / count).toFixed(2);
      const newInstallments = Array.from({ length: count }, (_, i) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          tempId: `new_${Date.now()}_${i}`,
          installmentNumber: i + 1,
          installmentValue: parseFloat(perInstallment),
          dueDate: dueDate.toISOString().split('T')[0],
          description: values.description || ''
        };
      });
      setFieldValue('installments', newInstallments);
    }
  }, [values.installmentsCount, values.totalValue, values.baseDueDate, values.description, setFieldValue]);

  return null;
};

/**
 * Drawer for adding or editing financial installments.
 */
export function DocumentFinanceDrawer({
  open,
  onClose,
  initialData,
  onSave
}) {
  const isEdit = !!(initialData?.id || initialData?.tempId);

  const initialValues = isEdit ? { 
    ...initialData, 
    isEdit: true,
    // Ensure Date format
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
  } : {
    isEdit: false,
    totalValue: 0,
    baseDueDate: new Date().toISOString().split('T')[0],
    installmentsCount: 1,
    description: '',
    installments: []
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 800 }, p: 0 }
      }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Editar Parcela' : 'Adicionar Parcelas'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) => {
            onSave(values);
            onClose();
          }}
        >
          {({ submitForm, values, setFieldValue }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              {!isEdit && <InstallmentsLogic />}
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  {!isEdit ? (
                    <>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={NumericField} name="totalValue" label="Valor Total" size="small" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={TextField} name="baseDueDate" label="Data base vencimento" type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={SelectField} name="installmentsCount" label="Quantidade de parcelas" size="small" options={
                          Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1} Parcela${i > 0 ? 's' : ''}` }))
                        } />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={NumericField} name="installmentNumber" label="Número da Parcela" size="small" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={NumericField} name="installmentValue" label="Valor" size="small" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Field component={TextField} name="dueDate" label="Vencimento" type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    </>
                  )}

                  <Grid size={12}>
                    <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
                  </Grid>

                  {!isEdit && (
                    <Grid size={12}>
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Parcela</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Valor Parcela</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Data Vencimento</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {values.installments.map((inst, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{inst.installmentNumber}</TableCell>
                                <TableCell>
                                  <Field
                                    component={NumericField}
                                    name={`installments[${idx}].installmentValue`}
                                    sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Field
                                    component={TextField}
                                    name={`installments[${idx}].dueDate`}
                                    size="small"
                                    type="date"
                                    sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {!isEdit && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      setFieldValue('totalValue', 0);
                      setFieldValue('installments', []);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#ffb300', '&:hover': { bgcolor: '#ffa000' } }}
                  >
                    Novo
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="success"
                  onClick={submitForm}
                  sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#2e7d32', px: 4 }}
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
