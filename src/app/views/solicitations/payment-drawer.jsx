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

  React.useEffect(() => {
    const count = parseInt(values.installmentsCount) || 0;
    const total = parseFloat(values.totalValue) || 0;
    const baseDate = values.baseDueDate ? new Date(values.baseDueDate) : new Date();

    if (count > 0 && total > 0) {
      const perInstallment = (total / count).toFixed(2);
      const newInstallments = Array.from({ length: count }, (_, i) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          id: i + 1,
          value: parseFloat(perInstallment),
          dueDate: dueDate.toISOString().split('T')[0]
        };
      });
      setFieldValue('installments', newInstallments);
    }
  }, [values.installmentsCount, values.totalValue, values.baseDueDate, setFieldValue]);

  return null;
};

/**
 * Drawer for adding or editing payment methods.
 */
export function PaymentDrawer({
  open,
  onClose,
  initialValues,
  onSave,
  title = 'Adicionar forma de pagamento'
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 800 }, p: 0 }
      }}
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
          initialValues={initialValues || {
            totalValue: 0,
            documentNumber: '',
            costCenter: 'Geral',
            issueDate: new Date().toISOString().substring(0, 16),
            baseDueDate: new Date().toISOString().substring(0, 10),
            installmentsCount: 1,
            description: '',
            installments: []
          }}
          enableReinitialize
          onSubmit={(values) => {
            onSave(values);
            onClose();
          }}
        >
          {({ submitForm, values, setFieldValue }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <InstallmentsLogic />
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={NumericField} name="totalValue" label="Valor Total" size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={TextField} name="documentNumber" label="Número do documento" size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={SelectField} name="costCenter" label="Centro de custo" size="small" options={[
                      { value: 'Geral', label: 'Geral' },
                      { value: 'Administrativo', label: 'Administrativo' },
                      { value: 'Operacional', label: 'Operacional' },
                    ]} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={TextField} name="issueDate" label="Data emissão" type="datetime-local" size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={TextField} name="baseDueDate" label="Data base vencimento" type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={SelectField} name="installmentsCount" label="Quantidade de parcelas" size="small" options={
                      Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1} Parcela${i > 0 ? 's' : ''}` }))
                    } />
                  </Grid>

                  <Grid size={12}>
                    <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
                  </Grid>

                  <Grid size={12}>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Valor Parcela</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Data Vencimento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {values.installments.map((inst, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{inst.id}</TableCell>
                              <TableCell>
                                <Field
                                  component={TextField}
                                  name={`installments[${idx}].value`}
                                  size="small"
                                  type="number"
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
                </Grid>
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => setFieldValue('installments', [])}
                  sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#ffb300', '&:hover': { bgcolor: '#ffa000' } }}
                >
                  Limpar Data Parcelas
                </Button>
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
