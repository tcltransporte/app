'use client'

import React, { useEffect, useState } from 'react'
import {
  Drawer, Box, Typography, IconButton, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Chip
} from '@mui/material'
import { Close as CloseIcon, Description as DocIcon, EditNote as EditIcon } from '@mui/icons-material'
import * as financeEntryAction from '@/app/actions/financeEntry.action'
import { ServiceStatus } from '@/libs/service'
import FinanceTitleInfoCard from './finance-title-info-card'

export default function FinanceTitleDetailsDrawer({ open, onClose, titleId, documentNumber, onEditEntry, refreshKey, onTop }) {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    if (open && titleId) {
      fetchEntries()
    }
  }, [open, titleId, refreshKey])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const result = await financeEntryAction.findAll({
        where: { titleId },
        limit: 100 // Should be enough for installments
      })

      if (result.header.status === ServiceStatus.SUCCESS) {
        setEntries(result.body.rows || result.body.items || [])
      }
    } catch (error) {
      console.error('Error fetching title entries:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => onTop ? theme.zIndex.modal + 1 : theme.zIndex.drawer }}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 }, p: 0 }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocIcon />
            <Typography variant="h6" fontWeight={700}>Documento: {documentNumber}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                <FinanceTitleInfoCard 
                  title={entries[0]?.title} 
                  onUpdate={fetchEntries}
                  sx={{ bgcolor: 'background.paper' }} 
                />
              </Box>

              <Divider />

              <Box sx={{ p: 2, bgcolor: 'action.hover', pb: 0 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                  TODAS AS PARCELAS VINCULADAS
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.selected' }}>
                      <TableRow>
                        <TableCell width={60}>Nº</TableCell>
                        <TableCell>Vencimento</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell width={50} align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell fontWeight={600}>{entry.installmentNumber}</TableCell>
                          <TableCell>
                            {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {parseFloat(entry.installmentValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={entry.paymentId ? 'Pago' : 'Pendente'}
                              size="small"
                              variant="outlined"
                              color={entry.paymentId ? 'success' : 'warning'}
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEditEntry?.(entry.id)}
                              title="Editar esta parcela"
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {entries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            Nenhuma parcela encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    {entries.length > 0 && (
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell colSpan={2} sx={{ fontWeight: 700 }}>TOTAL ACUMULADO</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            {entries.reduce((acc, curr) => acc + parseFloat(curr.installmentValue || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      </TableHead>
                    )}
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}
