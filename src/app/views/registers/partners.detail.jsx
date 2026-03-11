'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { getPartner } from '@/app/actions/partners.actions';

export function PartnerDetail({ partnerId, onClose, onSave }) {
  const [partnerData, setPartnerData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const isOpen = partnerId !== undefined;
  const isNew = partnerId === null;

  React.useEffect(() => {
    if (isOpen && !isNew) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const data = await getPartner(partnerId);
          setPartnerData(data);
        } catch (error) {
          console.error("Erro ao buscar parceiro:", error);
          setPartnerData(null); // Ensure partnerData is reset on error
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (isNew) {
      setPartnerData({}); // Clear for new
      setLoading(false); // No loading needed for new entry
    } else {
      // If dialog is closed, reset data to avoid showing stale data if reopened for a different ID
      setPartnerData(null);
    }
  }, [partnerId, isOpen, isNew]);

  // If the dialog is not meant to be open, return null
  if (!isOpen) {
    return null;
  }

  // Show a full-screen backdrop with CircularProgress while loading
  if (loading) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  // Only render the Dialog once loading is complete
  return (
    <Dialog
      open={isOpen && !loading} // Dialog is open only if isOpen and not loading
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isNew ? 'Novo Cliente' : `Editar Cliente: ${partnerData?.beneficiario || ''}`}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Nº Doc." defaultValue={partnerData?.doc} key={partnerData?.doc} fullWidth variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Vencimento" defaultValue={partnerData?.vencimento} key={partnerData?.vencimento} fullWidth variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Beneficiário" defaultValue={partnerData?.beneficiario} key={partnerData?.beneficiario} fullWidth variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Categoria" defaultValue={partnerData?.categoria} key={partnerData?.categoria} fullWidth variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Valor" defaultValue={partnerData?.valor} key={partnerData?.valor} fullWidth variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Tipo" defaultValue={partnerData?.tipo} key={partnerData?.tipo} fullWidth variant="outlined" size="small" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button onClick={onSave} variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
