'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  Typography,
  Select,
  MenuItem as MuiMenuItem,
  TextField,
} from '@mui/material';

export function DocumentDetail({ open, onClose, onSave, documentTypes, initialData }) {
  const [editForm, setEditForm] = React.useState({ documentTypeId: '', invoiceNumber: 0, invoiceDate: '', invoiceValue: 0 });

  React.useEffect(() => {
    if (open && initialData) {
      setEditForm(initialData);
    } else {
      setEditForm({ documentTypeId: '', invoiceNumber: 0, invoiceDate: '', invoiceValue: 0 });
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave(editForm);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Documento</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl size="small" fullWidth>
            <Typography variant="caption" color="text.secondary" mb={0.5}>Documento</Typography>
            <Select
              value={editForm.documentTypeId || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, documentTypeId: e.target.value }))}
              displayEmpty
            >
              <MuiMenuItem value=""><em>Selecione...</em></MuiMenuItem>
              {documentTypes.map(dt => (
                <MuiMenuItem key={dt.id} value={dt.id}>{dt.description}</MuiMenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            fullWidth
            label="Número da NF"
            type="number"
            value={editForm.invoiceNumber}
            onChange={(e) => setEditForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
          />
          <TextField
            size="small"
            fullWidth
            label="Data da NF"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editForm.invoiceDate}
            onChange={(e) => setEditForm(prev => ({ ...prev, invoiceDate: e.target.value }))}
          />
          <TextField
            size="small"
            fullWidth
            label="Valor (R$)"
            type="number"
            inputProps={{ step: '0.01' }}
            value={editForm.invoiceValue}
            onChange={(e) => setEditForm(prev => ({ ...prev, invoiceValue: e.target.value }))}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!editForm.documentTypeId}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
