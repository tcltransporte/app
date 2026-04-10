'use client'

import React, { useState } from 'react'
import { Card, CardContent, Box, Typography, IconButton, Grid, Button, Tooltip, Chip, Badge } from '@mui/material'
import {
  Edit as EditIcon,
  Close as CancelIcon,
  Save as SaveIcon,
  CheckCircle as SuccessIcon,
  Description as DocIcon
} from '@mui/icons-material'
import { Formik, Form, Field } from 'formik'
import { TextField, AutoComplete, DateField } from '@/components/controls'
import * as financeAction from '@/app/actions/finance.action'
// import * as companyAction from '@/app/actions/settings/company.action'
import { alert } from '@/libs/alert'
import { ServiceStatus } from '@/libs/service'

export default function FinanceTitleInfoCard({ title, onUpdate, sx = {}, onViewEntries, onEditingChange }) {
  const [isEditing, setIsEditing] = useState(false)

  if (!title) return null

  const handleToggleEdit = () => {
    const newState = !isEditing;
    setIsEditing(newState);
    onEditingChange?.(newState);
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const data = {
        partnerId: values.partner?.id,
        accountPlanId: values.accountPlan?.id,
        costCenterId: values.costCenter?.id,
        companyId: values.company?.id,
        documentNumber: values.documentNumber,
        issueDate: values.issueDate ? new Date(values.issueDate).toISOString() : null,
      }

      const result = await financeAction.update(title.id, data)

      if (result.header.status !== ServiceStatus.SUCCESS) throw result

      alert.success('Sucesso', 'Informações do título atualizadas!')
      setIsEditing(false)
      onEditingChange?.(false)
      onUpdate?.()
    } catch (error) {
      alert.error('Erro', error?.body?.message || 'Erro ao atualizar título')
    } finally {
      setSubmitting(false)
    }
  }

  const searchPartners = async (search) => {
    try {
      const isSupplier = title.type_operation === 1
      const isCustomer = !isSupplier
      const response = await fetch('/api/search/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search, isSupplier, isCustomer })
      })
      if (!response.ok) throw new Error()
      return await response.json()
    } catch { return [] }
  }

  const searchAccountPlans = async (search) => {
    try {
      const response = await fetch('/api/search/account-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search })
      })
      if (!response.ok) throw new Error()
      return await response.json()
    } catch { return [] }
  }

  const searchCostCenters = async (search) => {
    try {
      const response = await fetch('/api/search/cost-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search })
      })
      if (!response.ok) throw new Error()
      return await response.json()
    } catch { return [] }
  }

  const searchCompanies = async (search) => {
    try {
      const response = await fetch('/api/search/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search })
      })
      if (!response.ok) throw new Error()
      return await response.json()
    } catch { return [] }
  }


  return (
    <Card variant="outlined" sx={{ bgcolor: 'action.hover', borderStyle: 'dashed', position: 'relative', ...sx }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Informações do Título
          </Typography>
          {!isEditing && (
            <Tooltip title="Editar informações do título">
              <IconButton size="small" onClick={handleToggleEdit} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {isEditing ? (
          <Formik
            initialValues={{
              partner: title.partner,
              accountPlan: title.accountPlan,
              costCenter: title.costCenter,
              company: title.company,
              documentNumber: title.documentNumber || '',
              issueDate: title.issueDate ? new Date(title.issueDate) : new Date()
            }}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, submitForm }) => (
              <Box> {/* Usando Box em vez de Form para evitar <form> aninhado */}
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Field
                      name="company"
                      component={AutoComplete}
                      label="Empresa / Filial"
                      text={(v) => v.surname || v.name}
                      onSearch={searchCompanies}
                      renderSuggestion={(v) => v.surname || v.name}
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field
                      name="documentNumber"
                      component={TextField}
                      label="Nº Doc."
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field
                      name="issueDate"
                      component={DateField}
                      label="Emissão"
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Field
                      name="partner"
                      component={AutoComplete}
                      label="Fornecedor/Cliente"
                      text={(v) => v.surname || v.name}
                      onSearch={searchPartners}
                      renderSuggestion={(v) => v.surname || v.name}
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Field
                      name="accountPlan"
                      component={AutoComplete}
                      label="Plano de Contas"
                      text={(v) => `${v.code} - ${v.description}`}
                      onSearch={searchAccountPlans}
                      renderSuggestion={(v) => `${v.code} - ${v.description}`}
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Field
                      name="costCenter"
                      component={AutoComplete}
                      label="Centro de Custo"
                      text={(v) => v.description}
                      onSearch={searchCostCenters}
                      renderSuggestion={(v) => v.description}
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        onClick={handleToggleEdit}
                        disabled={isSubmitting}
                        startIcon={<CancelIcon />}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="small"
                        onClick={submitForm} // Trigger manual do submit
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? null : <SaveIcon />}
                      >
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Formik>
        ) : (
          <>
            {title.company && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                {title.company.surname || title.company.name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Nº Doc: {title.documentNumber || '-'} | Emissão: {title.issueDate ? new Date(title.issueDate).toLocaleDateString('pt-BR') : '-'}
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {title.partner?.surname || title.partner?.name || 'Parceiro não informado'}
            </Typography>
            {title.accountPlan && (
              <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>
                {title.accountPlan.code} - {title.accountPlan.description}
              </Typography>
            )}
            {title.costCenter?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                CC: {title.costCenter.description}
              </Typography>
            )}
            {onViewEntries && (
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Tooltip title="Ver todas as parcelas">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onViewEntries}
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'primary.lighter' }
                    }}
                  >
                    <Badge
                      badgeContent={title.installmentsCount || '0'}
                      color="primary"
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.65rem',
                          height: 16,
                          minWidth: 16
                        }
                      }}
                    >
                      <DocIcon sx={{ fontSize: 20 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
