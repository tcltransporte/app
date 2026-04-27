'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { ManifestationType } from '@/libs/dfeManifestationType';

function labelForManifestationCode(code) {
  const entry = Object.values(ManifestationType).find((t) => t.code === code);
  return entry?.label || code || '—';
}

export default function DistributionManifestEventsDrawer({
  open,
  onClose,
  nsu,
  items,
  loading,
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 560, md: 720 }, p: 0 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6" fontWeight={700}>
              Eventos de manifestação{nsu != null && nsu !== '' ? ` (NSU: ${nsu})` : ''}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !items || items.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Nenhum evento registrado para esta distribuição.
            </Typography>
          ) : (
            <Table size="small" sx={{ bgcolor: 'background.paper' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Quando</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Sucesso</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {ev.occurredAt ? new Date(ev.occurredAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>{labelForManifestationCode(ev.manifestationCode)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ev.success ? 'Sim' : 'Não'}
                        color={ev.success ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280, wordBreak: 'break-word' }}>
                      {ev.message || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
