'use client'

import React, { useEffect, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import {
  Grid, Button, Typography, Box, Divider,
  Card, CardContent, Chip, Skeleton
} from '@mui/material'
import { Save as SaveIcon, Edit as EditIcon, History as HistoryIcon } from '@mui/icons-material'
import { Dialog } from '@/components/common'
import { TextField, DateField, NumericField } from '@/components/controls'
import * as financeEntryAction from '@/app/actions/financeEntry.action'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'
import FinanceTitleInfoCard from './finance-title-info-card'

const validate = (values) => {
  const errors = {}
  if (!values.dueDate) errors.dueDate = 'Campo obrigatório'
  if (!values.installmentNumber) errors.installmentNumber = 'Campo obrigatório'
  if (!values.installmentValue || values.installmentValue <= 0) {
    errors.installmentValue = 'O valor deve ser maior que zero'
  }
  return errors
}

export default function FinanceEntryModal({ open, onClose, entryId, onSuccess }) {
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    if (open && entryId) {
      fetchEntry()
    }
  }, [open, entryId])

  const fetchEntry = async () => {
    setLoading(true)
    try {
      const result = await financeEntryAction.findEntry(entryId)
      if (result.header.status !== ServiceStatus.SUCCESS) throw result
      setEntry(result.body)
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao carregar dados da parcela')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await financeEntryAction.updateEntry(entryId, values)

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result
      }

      alert.success('Sucesso', 'Parcela atualizada com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao atualizar parcela')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={onClose} title="Editar Parcela Financeira" width="md">
      {loading ? (
        <Dialog.Content>
          <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}><Skeleton variant="rectangular" height={50} /></Grid>
            <Grid item xs={6}><Skeleton variant="rectangular" height={50} /></Grid>
            <Grid item xs={12}><Skeleton variant="rectangular" height={100} /></Grid>
          </Grid>
        </Dialog.Content>
      ) : (
        <Formik
          initialValues={{
            dueDate: entry?.dueDate ? new Date(entry.dueDate) : new Date(),
            installmentValue: entry?.installmentValue || 0,
            installmentNumber: entry?.installmentNumber || '',
            description: entry?.description || ''
          }}
          validate={validate}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form>
              <Dialog.Content>
                {/* Header Context (Read-only) */}
                <FinanceTitleInfoCard title={entry?.title} sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <Field
                      name="installmentNumber"
                      component={TextField}
                      label="Nº Parcela"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <Field
                      name="dueDate"
                      component={DateField}
                      label="Vencimento"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <Field
                      name="installmentValue"
                      component={NumericField}
                      label="Valor"
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

                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon fontSize="small" color="disabled" />
                  <Typography variant="caption" color="text.secondary">
                    As alterações nesta parcela não afetarão outras parcelas deste mesmo documento.
                  </Typography>
                </Box>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting ? null : <SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Atualizando...' : 'Atualizar Parcela'}
                </Button>
              </Dialog.Actions>
            </Form>
          )}
        </Formik>
      )}
    </Dialog>
  )
}
