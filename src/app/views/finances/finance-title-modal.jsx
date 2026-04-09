'use client'

import React from 'react'
import { Formik, Form, Field, FieldArray } from 'formik'
import {
  Grid, Button, Typography, IconButton, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import { Dialog } from '@/components/common'
import { TextField, AutoComplete, DateField, NumericField, SelectField } from '@/components/controls'
import * as partnerAction from '@/app/actions/partner.action'
import * as accountPlanAction from '@/app/actions/accountPlan.action'
import * as financeAction from '@/app/actions/finance.action'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'

const validate = (values) => {
  const errors = {}
  if (!values.partner) errors.partner = 'Campo obrigatório'
  if (!values.accountPlan) errors.accountPlan = 'Campo obrigatório'
  if (!values.documentNumber) errors.documentNumber = 'Campo obrigatório'
  if (!values.issueDate) errors.issueDate = 'Campo obrigatório'
  if (values.totalValue <= 0) errors.totalValue = 'Obrigatório'
  if (values.installments <= 0) errors.installments = 'Obrigatório'

  if (!values.entries || values.entries.length === 0) {
    errors.entries = 'Adicione pelo menos uma parcela'
  } else {
    const entriesErrors = values.entries.map(entry => {
      const entryErrors = {}
      if (!entry.dueDate) entryErrors.dueDate = 'Obrigatório'
      if (!entry.installmentNumber) entryErrors.installmentNumber = 'Obrigatório'
      if (!entry.installmentValue || entry.installmentValue <= 0) {
        entryErrors.installmentValue = 'Deve ser > 0'
      }
      return Object.keys(entryErrors).length > 0 ? entryErrors : null
    })
    if (entriesErrors.some(e => e !== null)) {
      errors.entries = entriesErrors
    }
  }
  return errors
}

const AutoGenerateInstallmentsWatcher = ({ values, setFieldValue }) => {
  React.useEffect(() => {
    if (values.totalValue > 0 && values.installments > 0) {
      const valuePerInstallment = values.totalValue / values.installments
      const newEntries = Array.from({ length: values.installments }).map((_, i) => {
        const date = new Date(values.issueDate || new Date())
        date.setMonth(date.getMonth() + i + 1)
        return {
          dueDate: date,
          installmentValue: valuePerInstallment,
          installmentNumber: String(i + 1),
          description: ''
        }
      })
      setFieldValue('entries', newEntries)
    }
  }, [values.totalValue, values.installments, values.issueDate, setFieldValue])
  return null
}

export default function FinanceTitleModal({ open, onClose, operationType, onSuccess }) {
  const initialValues = {
    partner: null,
    accountPlan: null,
    documentNumber: '',
    issueDate: new Date(),
    totalValue: 0,
    installments: 1,
    type_operation: operationType, // 1: Payable, 2: Receivable
    entries: [
      { dueDate: new Date(), installmentValue: 0, installmentNumber: '1', description: '' }
    ]
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const data = {
        ...values,
        partnerId: values.partner.id,
        accountPlanId: values.accountPlan.id,
        entries: values.entries.map(e => ({
          ...e,
          dueDate: new Date(e.dueDate).toISOString()
        }))
      }

      const result = await financeAction.create(data)

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result
      }

      alert.success('Sucesso', 'Título financeiro criado com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao criar título financeiro')
    } finally {
      setSubmitting(false)
    }
  }

  const searchPartners = async (query) => {
    const filters = operationType === 1 ? { isSupplier: true } : { isCustomer: true }
    if (query) filters.surname = query
    const result = await partnerAction.findAll({ filters, limit: 20 })
    return result.body.items || []
  }

  const searchAccountPlans = async (query) => {
    const filters = {}
    if (query) filters.description = query
    const result = await accountPlanAction.findAll({ where: filters, limit: 50 })
    return result.body || []
  }

  return (
    <Dialog open={open} onClose={onClose} title="Adicionar Título Financeiro" width="md">
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form>
            <AutoGenerateInstallmentsWatcher values={values} setFieldValue={setFieldValue} />
            <Dialog.Content>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Field
                    name="documentNumber"
                    component={TextField}
                    label="Nº Doc."
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Field
                    name="issueDate"
                    component={DateField}
                    label="Data de Emissão"
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Field
                    name="totalValue"
                    component={NumericField}
                    label="Valor Total"
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Field
                    name="installments"
                    component={SelectField}
                    placeholder={null}
                    options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}x` }))}
                    label="Nº Parcelas"
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="partner"
                    component={AutoComplete}
                    label="Fornecedor/Cliente"
                    text={(v) => v.surname || v.name}
                    onSearch={searchPartners}
                    renderSuggestion={(v) => v.surname || v.name}
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="accountPlan"
                    component={AutoComplete}
                    label="Plano de Contas"
                    text={(v) => `${v.code} - ${v.description}`}
                    onSearch={searchAccountPlans}
                    renderSuggestion={(v) => `${v.code} - ${v.description}`}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight={700}>Parcelas</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="primary" fontWeight={700}>
                      Total: {(values.entries.reduce((acc, curr) => acc + (Number(curr.installmentValue) || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <FieldArray name="entries">
                    {({ push, remove }) => (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell width={80}>Nº</TableCell>
                              <TableCell width={180}>Vencimento</TableCell>
                              <TableCell width={180}>Valor</TableCell>
                              <TableCell>Descrição/Obs</TableCell>
                              <TableCell width={50} align="center">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => push({
                                    dueDate: new Date(),
                                    installmentValue: 0,
                                    installmentNumber: String(values.entries.length + 1),
                                    description: ''
                                  })}
                                >
                                  <AddIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {values.entries.map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Field
                                    name={`entries.${index}.installmentNumber`}
                                    component={TextField}
                                    variant="standard"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Field
                                    name={`entries.${index}.dueDate`}
                                    component={DateField}
                                    variant="standard"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Field
                                    name={`entries.${index}.installmentValue`}
                                    component={NumericField}
                                    variant="standard"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Field
                                    name={`entries.${index}.description`}
                                    component={TextField}
                                    variant="standard"
                                    size="small"
                                    placeholder="Opcional..."
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {values.entries.length > 1 && (
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => remove(index)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </FieldArray>
                </Grid>
              </Grid>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onClick={onClose} color="inherit">Cancelar</Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? null : <SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Título'}
              </Button>
            </Dialog.Actions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}
