'use client'

import React from 'react'
import { Formik, Form, Field } from 'formik'
import { Grid, Button } from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { Dialog } from '@/components/common'
import { TextField, AutoComplete, DateField, NumericField, SelectField } from '@/components/controls'
import * as financeAction from '@/app/actions/finance.action'
import * as search from '@/libs/search'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'

const validate = (values) => {
  const errors = {}
  if (!values.typeId) errors.typeId = 'Obrigatório'
  if (!values.bankAccount) errors.bankAccount = 'Obrigatório'
  if (!values.realDate) errors.realDate = 'Obrigatório'
  if (values.value <= 0) errors.value = 'Deve ser maior que zero'
  if (!values.documentNumber) errors.documentNumber = 'Obrigatório'
  return errors
}

export default function BankMovementModal({ open, onClose, initialBankAccount, onSuccess }) {
  const initialValues = {
    typeId: 2, // Default to Débito (Saída)
    bankAccount: initialBankAccount || null,
    realDate: new Date(),
    value: 0,
    documentNumber: '',
    description: '',
    nominal: ''
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const data = {
        ...values,
        bankAccountId: values.bankAccount.id,
        // model logic handles entryDate, realDate fallback etc
      }

      const result = await financeAction.createBankMovement(data)

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result
      }

      alert.success('Sucesso', 'Lançamento registrado com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao registrar lançamento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo Lançamento Bancário" width="sm">
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting }) => (
          <Form>
            <Dialog.Content>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="typeId"
                    component={SelectField}
                    label="Tipo de Lançamento"
                    options={[
                      { value: 1, label: 'Entrada / Crédito' },
                      { value: 2, label: 'Saída / Débito' },
                    ]}
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="realDate"
                    component={DateField}
                    label="Data do Movimento"
                  />
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Field
                    name="bankAccount"
                    component={AutoComplete}
                    label="Conta Bancária"
                    text={(v) => `${v.description} (${v.bankName})`}
                    onSearch={(v, s) => search.bankAccount({ query: v }, s)}
                    renderSuggestion={(v) => (
                      <span>
                        <strong>{v.description}</strong> - {v.bankName} (Ag: {v.agency} / Cc: {v.accountNumber})
                      </span>
                    )}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="value"
                    component={NumericField}
                    label="Valor"
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Field
                    name="documentNumber"
                    component={TextField}
                    label="Nº Documento"
                    type="number"
                  />
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Field
                    name="nominal"
                    component={TextField}
                    label="Nominal a"
                    placeholder="Opcional..."
                  />
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Field
                    name="description"
                    component={TextField}
                    label="Descrição / Observação"
                    multiline
                    rows={2}
                  />
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
                color={values.typeId === 1 ? 'success' : 'primary'}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </Dialog.Actions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}
