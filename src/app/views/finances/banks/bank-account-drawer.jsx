'use client'

import React, { useEffect, useState } from 'react'
import { Formik, Form } from 'formik'
import {
  Drawer, Box, Typography, IconButton, Divider, Button, Grid, Stack, Avatar
} from '@mui/material'
import { Close as CloseIcon, Save as SaveIcon, AccountBalance as BankIcon } from '@mui/icons-material'
import { TextField, AutoComplete, NumericField } from '@/components/controls'
import * as search from '@/libs/search'
import * as bankAccountAction from '@/app/actions/bankAccount.action'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'

const validate = (values) => {
  const errors = {}
  if (!values.description) errors.description = 'Campo obrigatório'
  if (!values.bank && !values.bankName) errors.bankName = 'Campo obrigatório'
  if (!values.agency) errors.agency = 'Campo obrigatório'
  if (!values.accountNumber) errors.accountNumber = 'Campo obrigatório'
  if (!values.holderName) errors.holderName = 'Campo obrigatório'
  if (values.initialBalance === undefined || values.initialBalance === null) errors.initialBalance = 'Campo obrigatório'
  return errors
}

export default function BankAccountDrawer({ open, onClose, onSuccess }) {

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const data = {
        description: values.description,
        bankId: values.bank?.id || null,
        bankName: values.bank?.description || values.bankName,
        agency: values.agency,
        accountNumber: values.accountNumber,
        holderName: values.holderName,
        initialBalance: values.initialBalance
      }

      const result = await bankAccountAction.create(data)

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result
      }

      alert.success('Sucesso', 'Conta bancária cadastrada com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao cadastrar conta bancária')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, p: 0 }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BankIcon />
            <Typography variant="h6" fontWeight={700}>Nova Conta Bancária</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Formik
            initialValues={{
              description: '',
              bank: null,
              bankName: '',
              agency: '',
              accountNumber: '',
              holderName: '',
              initialBalance: 0
            }}
            validate={validate}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Descrição da Conta"
                      fullWidth
                      placeholder="Ex: Conta Corrente Principal"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <AutoComplete
                      name="bank"
                      label="Banco"
                      text={(v) => v.description || ''}
                      onSearch={(v, s) => search.bank({ query: v }, s)}
                      renderSuggestion={(v) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            variant="rounded"
                            src={v.icon || (v.code ? `/assets/banks/${v.code}.png` : undefined)}
                            sx={{ width: 24, height: 24, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
                          >
                            <BankIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'inherit' }} noWrap>
                            {v.description}
                          </Typography>
                        </Box>
                      )}
                      fullWidth
                    />
                  </Grid>

                  {!values.bank && (
                    <Grid item xs={12}>
                      <TextField
                        name="bankName"
                        label="Nome do Banco (Manual)"
                        fullWidth
                      />
                    </Grid>
                  )}

                  <Grid item xs={6}>
                    <TextField
                      name="agency"
                      label="Agência"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      name="accountNumber"
                      label="Número da Conta"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      name="holderName"
                      label="Nome do Titular"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <NumericField
                      name="initialBalance"
                      label="Saldo Inicial"
                      fullWidth
                      InputProps={{ startAdornment: 'R$ ' }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    loading={isSubmitting}
                    startIcon={<SaveIcon />}
                  >
                    Salvar
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </Drawer>
  )
}
