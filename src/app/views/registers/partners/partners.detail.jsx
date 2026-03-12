'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, NumericField, CheckField, DateField, SelectField } from '@/components/controls';
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
        valor: data.valor,
        tipo: data.tipo ?? '',
        ativo: data.ativo ?? true,
      }}
      onSubmit={onSave}
    >
      {({ submitForm }) => (
        <Dialog
          open={partnerId !== undefined}
          loading={loading}
          title={partnerId === null ? 'Novo Cliente' : `Editar Cliente: ${data?.beneficiario || ''}`}
          onClose={onClose}
        >
          <Dialog.Content>
            <Form>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Field component={TextField} name="doc" label="Nº Doc." fullWidth size="small" transform="uppercase" /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field component={DateField} name="vencimento" label="Vencimento" fullWidth size="small" /></Grid>
                <Grid size={12}><Field component={TextField} name="beneficiario" label="Beneficiário" fullWidth size="small" transform="uppercase" /></Grid>
                <Grid size={12}><Field component={TextField} name="categoria" label="Categoria" fullWidth size="small" /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field component={NumericField} name="valor" label="Valor" fullWidth size="small" /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field component={SelectField} name="tipo" label="Tipo" fullWidth size="small" options={[
                  { value: 'entrada', label: 'Entrada' },
                  { value: 'saida', label: 'Saída' },
                ]} /></Grid>
                <Grid size={12}><Field component={CheckField} name="ativo" label="Ativo" /></Grid>
              </Grid>
            </Form>
          </Dialog.Content>


          <Dialog.Actions>
            <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
            <Button onClick={submitForm} variant="contained" sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>
      )}
    </Formik>
  );
}

