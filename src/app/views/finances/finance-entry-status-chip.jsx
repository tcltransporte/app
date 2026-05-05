'use client'

import React from 'react'
import { Chip } from '@mui/material'

/**
 * EntryStatusChip
 *
 * Lista (contas a receber/pagar): usa `entry.displayStatus` quando existir
 * ('paid' | 'pending_recon' | 'late' | 'open'). Caso contrário, cai no `entry.status` do model.
 *
 * @param {object}  entry          - Parcela financeira
 * @param {number}  operationType  - 1 = recebível (Recebido), 2 = pagável (Pago)
 * @param {object}  sx             - Optional extra MUI sx styles
 */
export default function EntryStatusChip({ entry, operationType, sx, onClick }) {
  const statusKey = entry?.displayStatus ?? entry?.status

  const statusMap = {
    paid: {
      label: operationType === 2 ? 'Pago' : 'Recebido',
      color: 'success',
    },
    pending_recon: {
      label: 'Pendente',
      color: 'warning',
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

  const { label, color } = statusMap[statusKey] ?? statusMap.open

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
