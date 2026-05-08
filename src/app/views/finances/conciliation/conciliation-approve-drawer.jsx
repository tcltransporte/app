'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, Table, TableBody, TableCell, TableRow, Grid, Stack, Collapse } from '@mui/material';
import { Close as CloseIcon, CheckCircle as CheckIcon, ListAlt as ListIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { AutoComplete, DateField } from '@/components/controls';
import * as search from '@/libs/search';

function validate(values) {
  const errors = {};
  if (!Array.isArray(values.movements) || values.movements.length === 0) {
    errors.movements = 'Nenhum movimento selecionado';
    return errors;
  }

  const movementErrors = values.movements.map((item) => {
    const itemErrors = {};
    if (!item.realDate) itemErrors.realDate = 'Obrigatório';
    if (!item.bankAccount) itemErrors.bankAccount = 'Obrigatório';
    return Object.keys(itemErrors).length ? itemErrors : null;
  });

  if (movementErrors.some((item) => item !== null)) {
    errors.movements = movementErrors;
  }

  return errors;
}

function MovementRow({ item, index }) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <>
      <TableRow sx={{ backgroundColor: 'action.hover' }}>
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Nº Doc: {item.documentNumber || '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.description || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>
          {(Number(item.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={3} sx={{ py: 0, px: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 1.25 }}>
              <Grid container spacing={0.75}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    name={`movements.${index}.realDate`}
                    component={DateField}
                    label="Data Pgto"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Field
                    name={`movements.${index}.bankAccount`}
                    component={AutoComplete}
                    label="Conta Bancária"
                    text={(v) => `${v?.description || ''}`}
                    onSearch={(value, signal) => search.bankAccount({ search: value }, signal)}
                    renderSuggestion={(v) => `${v?.description || ''}`}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ConciliationApproveDrawer({ open, movements = [], selectedCount = 1, onClose, onConfirm, loading = false }) {
  const initialValues = {
    movements: (movements || []).map((item) => ({
      movementId: item.id,
      documentNumber: item.documentNumber || '',
      description: item.description || '',
      value: Number(item.value) || 0,
      realDate: item?.realDate ? new Date(item.realDate) : new Date(),
      bankAccount: item?.bankAccount || null
    }))
  };

  const applyGlobal = (field, value, setFieldValue, currentValues) => {
    const updated = (currentValues.movements || []).map((item) => ({
      ...item,
      [field]: value
    }));
    setFieldValue('movements', updated);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 550 }, p: 0 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh / var(--app-zoom, 1))' }}>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validate={validate}
          onSubmit={(values, { setSubmitting }) => {
            Promise.resolve(onConfirm?.(values)).finally(() => setSubmitting(false));
          }}
        >
          {({ isSubmitting, values, setFieldValue, submitForm }) => {
            const totalValue = (values.movements || []).reduce(
              (sum, movement) => sum + (Number(movement?.value) || 0),
              0
            );

            return (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ListIcon />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Aprovar Conciliação{selectedCount > 1 ? ` (${selectedCount})` : ''}
                  </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
                {movements.length > 0 && (
                  <Box>
                    {values.movements.length > 1 && (
                      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 1.5 }}>
                        <Grid container spacing={0.75}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Field
                              name="globalRealDate"
                              component={DateField}
                              label="Data Pgto (todos)"
                              fullWidth
                              onChange={(val) => applyGlobal('realDate', val, setFieldValue, values)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <Field
                              name="globalBankAccount"
                              component={AutoComplete}
                              label="Conta Bancária (todos)"
                              text={(v) => `${v?.description || ''}`}
                              onSearch={(value, signal) => search.bankAccount({ search: value }, signal)}
                              renderSuggestion={(v) => `${v?.description || ''}`}
                              fullWidth
                              onChange={(val) => applyGlobal('bankAccount', val, setFieldValue, values)}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.5, px: 0.75 } }}>
                        <TableBody>
                          {(values.movements || []).map((item, index) => (
                            <MovementRow key={item.movementId || index} item={item} index={index} />
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider />
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'action.hover',
                  borderTop: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Valor total selecionado
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={2}>
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
                    type="button"
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={submitForm}
                    disabled={isSubmitting || loading}
                    sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 3 }}
                  >
                    {isSubmitting || loading ? 'Processando...' : 'Confirmar'}
                  </Button>
                </Stack>
              </Box>
            </Form>
            );
          }}
        </Formik>
      </Box>
    </Drawer>
  );
}
