'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, SelectField } from '@/components/controls';
import * as solicitationService from '@/app/services/solicitation.service';
import { alert } from '@/libs/alert';

export default function SolicitationDetail({ solicitationId, onClose, onSave, typeHash }) {

  const formikRef = React.useRef(null);
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (solicitationId === undefined) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }
    
    if (solicitationId === null) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }

    setLoading(true)
    solicitationService.findOne(solicitationId)
      .then(d => {
        setData(d ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [solicitationId])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const payload = { ...values };
      if (typeHash) payload.typeHash = typeHash;

      if (solicitationId) {
        await solicitationService.update(Number(solicitationId), payload)
      } else {
        await solicitationService.create(payload)
      }
      alert.success('Salvo com sucesso!');
      onSave?.()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert.error('Erro ao salvar', 'Ocorreu um problema ao tentar salvar o registro.');
    } finally {
      setLoading(false)
    }
  }

  return (
    <Formik
      innerRef={formikRef}
      enableReinitialize
      initialValues={{
        description: data.description ?? '',
        number: data.number ?? '',
        statusId: data.statusId ?? 1,
        typeId: data.typeId ?? '',
        forecastDate: data.forecastDate ? String(data.forecastDate).substring(0, 10) : '',
        tripId: data.tripId ?? '',
        tripGroupId: data.tripGroupId ?? '',
        processId: data.processId ?? '',
        customerId: data.customerId ?? '',
        tributationId: data.tributationId ?? '',
        sellerId: data.sellerId ?? '',
      }}
      onSubmit={handleSubmit}
    >
      {({ submitForm }) => (
        <Dialog
          open={solicitationId !== undefined}
          loading={loading && !Object.keys(data).length}
          title={solicitationId === null ? 'Nova Solicitação' : `Editar Solicitação: ${data?.number || ''}`}
          onClose={onClose}
          width="800px"
        >
          <Dialog.Content>
            <Form>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field component={TextField} name="number" label="Número" fullWidth size="small" type="number" />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Field component={SelectField} name="statusId" label="Status" fullWidth size="small" options={[
                    { value: 1, label: 'Pendente' },
                    { value: 2, label: 'Em Andamento' },
                    { value: 3, label: 'Concluído' },
                    { value: 4, label: 'Cancelado' },
                  ]} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="forecastDate" label="Data Previsão" type="date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                
                <Grid size={12}>
                  <Field component={TextField} name="description" label="Descrição" fullWidth size="small" multiline rows={2} />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="tripId" label="ID Viagem" fullWidth size="small" type="number" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="tripGroupId" label="ID Viagem Grupo" fullWidth size="small" type="number" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="processId" label="ID Processo" fullWidth size="small" type="number" />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field component={TextField} name="customerId" label="ID Cliente" fullWidth size="small" type="number" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field component={TextField} name="sellerId" label="ID Vendedor" fullWidth size="small" type="number" />
                </Grid>
                
                <Grid size={12}>
                  <Field component={TextField} name="tributationId" label="Tributação (UUID)" fullWidth size="small" />
                </Grid>
              </Grid>
            </Form>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onClick={onClose} color="inherit" disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
            <Button 
              onClick={submitForm} 
              variant="contained" 
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {loading && Object.keys(data).length ? 'Salvando...' : 'Salvar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      )}
    </Formik>
  );
}
