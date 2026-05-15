'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import * as cteAction from '@/app/actions/cte.action';
import * as shipmentAction from '@/app/actions/shipment.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

const ACCEPT = '.xml,application/xml,text/xml';

function readFileAsText(file) {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default function KnowledgeUploadDrawer({
  open,
  onClose,
  onImported,
  loadId = null,
  shipmentLabel = null
}) {
  const [files, setFiles] = React.useState([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = React.useRef(null);

  const reset = React.useCallback(() => {
    setFiles([]);
    setDragOver(false);
    setSubmitting(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleClose = React.useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, onClose, reset]);

  const addFileList = React.useCallback((fileList) => {
    const incoming = Array.from(fileList || []).filter(Boolean);
    if (incoming.length === 0) return;
    setFiles((prev) => {
      const map = new Map();
      for (const f of prev) {
        map.set(`${f.name}_${f.size}_${f.lastModified}`, f);
      }
      for (const f of incoming) {
        const isXml =
          f.type === 'application/xml' ||
          f.type === 'text/xml' ||
          /\.xml$/i.test(f.name);
        if (!isXml) continue;
        map.set(`${f.name}_${f.size}_${f.lastModified}`, f);
      }
      return Array.from(map.values());
    });
  }, []);

  const onDrop = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      addFileList(e.dataTransfer?.files);
    },
    [addFileList]
  );

  const onDragOver = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const removeAt = React.useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImport = React.useCallback(async () => {
    if (files.length === 0) {
      alert.warning('Nenhum arquivo', 'Adicione um ou mais arquivos XML de CT-e.');
      return;
    }
    setSubmitting(true);
    try {
      const items = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          xml: await readFileAsText(file)
        }))
      );
      const result = loadId
        ? await shipmentAction.importCtesForShipment(loadId, items)
        : await cteAction.importFromXmls(items);
      if (result?.header?.status !== ServiceStatus.SUCCESS) {
        throw result;
      }
      const { created = 0, skipped = 0, receivablesCreated = 0, cteNotasLinked = 0, failed = [] } = result.body || {};
      const parts = [
        `${created} CT-e importado(s)`,
        receivablesCreated ? `${receivablesCreated} conta(s) a receber` : null,
        cteNotasLinked ? `${cteNotasLinked} vínculo(s) CT-e × nota` : null,
        skipped ? `${skipped} já existente(s)` : null,
        failed.length ? `${failed.length} com erro` : null
      ].filter(Boolean);
      if (failed.length > 0) {
        const detail = failed.slice(0, 5).map((f) => `${f.filename}: ${f.message}`).join('\n');
        alert.warning('Importação concluída com avisos', `${parts.join(', ')}.\n\n${detail}`);
      } else {
        alert.success(parts.join(', '));
      }
      reset();
      onClose();
      if (typeof onImported === 'function') onImported();
    } catch (error) {
      alert.error('Falha na importação', error?.body?.message || error?.message || String(error));
    } finally {
      setSubmitting(false);
    }
  }, [files, loadId, onClose, onImported, reset]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 440 }, display: 'flex', flexDirection: 'column' }
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CloudUploadIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            {loadId
              ? `Importar CT-e na carga${shipmentLabel ? ` — ${shipmentLabel}` : ''}`
              : 'Importar XML de CT-e'}
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'inherit' }} disabled={submitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

        <Box
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !submitting && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            borderRadius: 2,
            py: 4,
            px: 2,
            textAlign: 'center',
            cursor: submitting ? 'default' : 'pointer',
            bgcolor: dragOver ? 'action.hover' : 'background.default',
            transition: 'border-color 0.2s, background-color 0.2s',
            outline: 'none',
            '&:focus-visible': { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` }
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Solte os XML aqui
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            ou clique para escolher arquivos
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            disabled={submitting}
            onChange={(e) => {
              addFileList(e.target.files);
              e.target.value = '';
            }}
          />
        </Box>

        {files.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>
              FILA ({files.length})
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {files.map((file, index) => (
                <ListItem
                  key={`${file.name}_${file.size}_${file.lastModified}`}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => removeAt(index)} disabled={submitting} aria-label="Remover">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <FileIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {submitting && <LinearProgress sx={{ mb: 2 }} />}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleImport} disabled={submitting || files.length === 0}>
            Importar
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
