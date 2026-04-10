'use client'

import React from 'react'
import { Chip } from '@mui/material'

/**
 * EntryStatusChip
 *
 * Renders a status chip based on the `entry.status` virtual field from FinanceEntry model.
 * Possible values: 'paid' | 'late' | 'open'
 *
 * @param {object}  entry          - A FinanceEntry object (must have .status)
 * @param {number}  operationType  - 1 = receivable (Recebido), 2 = payable (Pago)
 * @param {object}  sx             - Optional extra MUI sx styles
 */
export default function EntryStatusChip({ entry, operationType, sx, onClick }) {
  const statusMap = {
    paid: {
      label: operationType === 2 ? 'Pago' : 'Recebido',
      color: 'success',
    },
    late: {
      label: 'Atrasado',
      color: 'error',
    },
    open: {
      label: 'Aberto',
      color: 'info',
    },
  }

  const { label, color } = statusMap[entry?.status] ?? statusMap.open

  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      color={color}
      onClick={onClick}
      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, ...sx }}
    />
  )
}
