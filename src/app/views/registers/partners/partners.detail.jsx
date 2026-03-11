'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, TextField, Button } from '@mui/material';
import { DetailModal } from '@/components/common/DetailModal';
import { getPartner } from '@/app/actions/partners.actions';

export function PartnerDetail({ partnerId, onClose, onSave }) {

  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!partnerId) { setData({}); return; }
    setLoading(true)
    getPartner(partnerId)
      .then(d => setData(d ?? {}))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [partnerId])

  return (
    <Formik
      enableReinitialize
      initialValues={{
        doc: data.doc ?? '',
        vencimento: data.vencimento ?? '',
        beneficiario: data.beneficiario ?? '',
        categoria: data.categoria ?? '',
        valor: data.valor ?? '',
        tipo: data.tipo ?? '',
      }}
      onSubmit={onSave}
    >
      {({ submitForm }) => (
        <DetailModal
          open={partnerId !== undefined}
          loading={loading}
          title={partnerId === null ? 'Novo Cliente' : `Editar Cliente: ${data?.beneficiario || ''}`}
          onClose={onClose}
        >
          <DetailModal.Content>
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Field as={TextField} name="doc" label="Nº Doc." fullWidth size="small" /></Grid>
                <Grid item xs={12} sm={6}><Field as={TextField} name="vencimento" label="Vencimento" fullWidth size="small" /></Grid>
                <Grid item xs={12}>       <Field as={TextField} name="beneficiario" label="Beneficiário" fullWidth size="small" /></Grid>
                <Grid item xs={12}>       <Field as={TextField} name="categoria" label="Categoria" fullWidth size="small" /></Grid>
                <Grid item xs={12} sm={6}><Field as={TextField} name="valor" label="Valor" fullWidth size="small" /></Grid>
                <Grid item xs={12} sm={6}><Field as={TextField} name="tipo" label="Tipo" fullWidth size="small" /></Grid>
              </Grid>
            </Form>
          </DetailModal.Content>

          <DetailModal.Actions>
            <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
            <Button onClick={submitForm} variant="contained" sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>Salvar</Button>
          </DetailModal.Actions>
        </DetailModal>
      )}
    </Formik>
  );
}
