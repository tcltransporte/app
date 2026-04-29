'use client';

import React from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export function PDFViewer({ open, onClose, base64, title = 'Visualizar PDF', fileName = 'documento.pdf' }) {
  const safeFileName = String(fileName || 'documento.pdf').trim() || 'documento.pdf';
  const pdfSrc = base64
    ? `data:application/pdf;name=${encodeURIComponent(safeFileName)};base64,${base64}`
    : '';
  const handleDownload = () => {
    if (!base64) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
        {pdfSrc ? (
          <iframe
            title="PDF Viewer"
            src={pdfSrc}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Nenhum PDF disponível.</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
