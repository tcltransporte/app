'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Divider,
  Typography,
} from '@mui/material';
import { SelectField } from '@/components/controls/SelectField';

export function DocumentDetail({ open, onClose, onSave, documentTypes, initialData }) {
  const [editForm, setEditForm] = React.useState({ id: null, documentTypeId: '', invoiceNumber: 0, invoiceDate: '', invoiceValue: 0 });

  React.useEffect(() => {
    if (open && initialData) {
      setEditForm({ ...initialData, id: initialData.id || null });
    } else {
      setEditForm({ id: null, documentTypeId: '', invoiceNumber: 0, invoiceDate: '', invoiceValue: 0 });
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
          <SelectField
            label="Documento"
            value={editForm.documentTypeId || ''}
            onChange={(val) => setEditForm(prev => ({ ...prev, documentTypeId: val }))}
            options={documentTypes.map(dt => ({ value: dt.id, label: dt.description }))}
            placeholder="Selecione..."
          />
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
