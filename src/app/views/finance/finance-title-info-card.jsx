'use client'

import React from 'react'
import { Card, CardContent, Box, Typography, Chip } from '@mui/material'

export default function FinanceTitleInfoCard({ title, sx = {} }) {
  if (!title) return null

  return (
    <Card variant="outlined" sx={{ bgcolor: 'action.hover', borderStyle: 'dashed', ...sx }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Título
          </Typography>
        </Box>
        <Typography variant="body1" fontWeight={700}>
          {title.partner?.surname || title.partner?.name || 'Parceiro não informado'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Doc: {title.documentNumber || '-'} | Emissão: {title.issueDate ? new Date(title.issueDate).toLocaleDateString('pt-BR') : '-'}
        </Typography>
        {title.accountPlan && (
          <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>
            {title.accountPlan.code} - {title.accountPlan.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
