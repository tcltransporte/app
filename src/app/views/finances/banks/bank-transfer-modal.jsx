'use client'

import React from 'react'
import { Formik, Form, Field } from 'formik'
import { Grid, Button, Avatar, Typography, Box } from '@mui/material'
import { Save as SaveIcon, AccountBalance as BankIcon, ArrowForward as ArrowIcon } from '@mui/icons-material'
import { Dialog } from '@/components/common'
import { AutoComplete, DateTimeField, NumericField, TextField } from '@/components/controls'
import * as financeAction from '@/app/actions/finance.action'
import * as search from '@/libs/search'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'

const validate = (values) => {
    const errors = {}
    if (!values.originAccount) errors.originAccount = 'Obrigatório'
    if (!values.destinationAccount) errors.destinationAccount = 'Obrigatório'
    if (values.originAccount && values.destinationAccount && values.originAccount.id === values.destinationAccount.id) {
        errors.destinationAccount = 'A conta de destino deve ser diferente da origem'
    }
    if (!values.realDate) errors.realDate = 'Obrigatório'
    if (values.value <= 0) errors.value = 'Deve ser maior que zero'
    return errors
}

export default function BankTransferModal({ open, onClose, onSuccess }) {
    const initialValues = {
        originAccount: null,
        destinationAccount: null,
        realDate: new Date(),
        value: 0,
        description: ''
    }

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const data = {
                originAccountId: values.originAccount.id,
                destinationAccountId: values.destinationAccount.id,
                value: values.value,
                realDate: values.realDate,
                description: values.description
            }

            const result = await financeAction.createBankTransfer(data)

            if (result.header.status !== ServiceStatus.SUCCESS) {
                throw result
            }

            alert.success('Sucesso', 'Transferência realizada com sucesso!')
            onSuccess?.()
            onClose()
        } catch (error) {
            alert.error('Erro', error?.body?.message || 'Erro ao realizar transferência')
        } finally {
            setSubmitting(false)
        }
    }

    const renderAccountOption = (v) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
                variant="rounded"
                src={v.bank?.code ? `/assets/banks/${v.bank.code}.png` : undefined}
                sx={{ width: 24, height: 24, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
            >
                <BankIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'inherit' }} noWrap>
                    {v.description}
                </Typography>
                <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }} noWrap>
                    {v.bankName} (Ag: {v.agency} / Cc: {v.accountNumber})
                </Typography>
            </Box>
        </Box>
    )

    return (
        <Dialog open={open} onClose={onClose} title="Transferência entre Contas" width="sm">
            <Formik
                initialValues={initialValues}
                validate={validate}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Dialog.Content>
                            <Grid container spacing={2}>
                                <Grid item size={{ xs: 12 }}>
                                    <Field
                                        name="originAccount"
                                        component={AutoComplete}
                                        label="Conta de Origem"
                                        text={(v) => `${v.description} (${v.bankName})`}
                                        onSearch={(v, s) => search.bankAccount({ query: v }, s)}
                                        renderSuggestion={renderAccountOption}
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', py: 0 }}>
                                    <ArrowIcon sx={{ transform: 'rotate(90deg)', color: 'text.secondary', opacity: 0.5 }} />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Field
                                        name="destinationAccount"
                                        component={AutoComplete}
                                        label="Conta de Destino"
                                        text={(v) => `${v.description} (${v.bankName})`}
                                        onSearch={(v, s) => search.bankAccount({ query: v }, s)}
                                        renderSuggestion={renderAccountOption}
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Field
                                        name="realDate"
                                        component={DateTimeField}
                                        label="Data da Transferência"
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Field
                                        name="value"
                                        component={NumericField}
                                        label="Valor"
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Field
                                        name="description"
                                        component={TextField}
                                        label="Descrição / Observação"
                                        placeholder="Ex: Reserva técnica, Ajuste de saldo..."
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
                                color="primary"
                            >
                                {isSubmitting ? 'Processando...' : 'Transferir'}
                            </Button>
                        </Dialog.Actions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    )
}
