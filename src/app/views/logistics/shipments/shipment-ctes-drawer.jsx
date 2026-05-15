'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DocIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import * as shipmentAction from '@/app/actions/shipment.action';
import { ServiceStatus } from '@/libs/service';
import { formatSqlDate } from '@/libs/date';
import KnowledgeUploadDrawer from '@/app/views/logistics/knowledge/knowledge-upload-drawer';

function formatIssuedAt(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);
  const m = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  return `${m.day}/${m.month}/${m.year} ${m.hour}:${m.minute}`;
}

export default function ShipmentCtesDrawer({ open, onClose, shipmentId, shipmentLabel, onCtesChanged }) {
  const [loading, setLoading] = React.useState(false);
  const [ctes, setCtes] = React.useState([]);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const loadCtes = React.useCallback(async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const result = await shipmentAction.findCtesByShipmentId(shipmentId);
      if (result?.header?.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      setCtes(result.body?.rows || []);
    } catch {
      setCtes([]);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  React.useEffect(() => {
    if (!open || !shipmentId) return;
    loadCtes();
  }, [open, shipmentId, loadCtes]);

  const handleImported = React.useCallback(() => {
    setUploadOpen(false);
    loadCtes();
    onCtesChanged?.();
  }, [loadCtes, onCtesChanged]);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 720 }, p: 0 }
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
              color: 'primary.contrastText'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <DocIcon />
              <Typography variant="h6" fontWeight={700} noWrap>
                CT-es da carga {shipmentLabel ? `— ${shipmentLabel}` : `#${shipmentId}`}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Importar XML
                </Button>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} />
              </Box>
            ) : ctes.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum CT-e vinculado a esta carga.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Emissão</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Nº</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Série</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remetente</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Destinatário</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>A receber</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ctes.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatIssuedAt(row.issuedAt) || formatSqlDate(row.issuedAt)}
                        </TableCell>
                        <TableCell align="right">{row.ctNumber ?? '—'}</TableCell>
                        <TableCell align="right">{row.ctSeries ?? '—'}</TableCell>
                        <TableCell>{row.remetenteFromXml || '—'}</TableCell>
                        <TableCell>
                          {row.destinatarioFromXml
                            || row.destinatario?.surname
                            || row.destinatario?.name
                            || '—'}
                        </TableCell>
                        <TableCell align="right">
                          {Number(row.amountToReceive || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </TableCell>
                        <TableCell align="center">{row.statusCode ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Drawer>

      <KnowledgeUploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={handleImported}
        loadId={shipmentId}
        shipmentLabel={shipmentLabel}
      />
    </>
  );
}
