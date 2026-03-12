'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, CheckField, SelectField } from '@/components/controls';
import * as partnerService from '@/app/services/partner.service';
import { alert } from '@/libs/alert';

export function PartnerDetail({ partnerId, onClose, onSave }) {

  const formikRef = React.useRef(null);
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (partnerId === undefined) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }
    
    if (partnerId === null) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }

    setLoading(true)
    partnerService.findOne(partnerId)
      .then(d => {
        setData(d ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [partnerId])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      if (partnerId) {
        await partnerService.update(Number(partnerId), values)
      } else {
        await partnerService.create(values)
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
        cpfCnpj: data.cpfCnpj ?? '',
        name: data.name ?? '',
        surname: data.surname ?? '',
        typeId: data.typeId ?? 1,
        isCustomer: data.isCustomer ?? false,
        isSupplier: data.isSupplier ?? false,
        isEmployee: data.isEmployee ?? false,
        isSeller: data.isSeller ?? false,
        isActive: data.isActive ?? true,
        daysDeadlinePayment: data.daysDeadlinePayment ?? '',
        externalId: data.externalId ?? '',
        birthDate: data.birthDate ? String(data.birthDate).substring(0, 10) : '',
      }}
      onSubmit={handleSubmit}
    >
      {({ submitForm }) => (
        <Dialog
          open={partnerId !== undefined}
          loading={loading && !Object.keys(data).length} // Use dialog loading only for initial fetch
          title={partnerId === null ? 'Novo Cliente' : `Editar Cliente: ${data?.surname || ''}`}
          onClose={onClose}
        >
          <Dialog.Content>
            <Form>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={SelectField} name="typeId" label="Tipo Pessoa" fullWidth size="small" options={[
                    { value: 1, label: 'Pessoa Física' },
                    { value: 2, label: 'Pessoa Jurídica' },
                  ]} />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Field component={TextField} name="cpfCnpj" label="CPF/CNPJ" fullWidth size="small" />
                </Grid>
                <Grid size={12}>
                  <Field component={TextField} name="name" label="Razão Social" fullWidth size="small" transform="uppercase" />
                </Grid>
                <Grid size={12}>
                  <Field component={TextField} name="surname" label="Nome Fantasia" fullWidth size="small" transform="uppercase" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field component={TextField} name="birthDate" label="Data de Nascimento" type="date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field component={TextField} name="daysDeadlinePayment" label="Prazo Pagamento (dias)" fullWidth size="small" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field component={TextField} name="externalId" label="ID Externo" fullWidth size="small" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}><Field component={CheckField} name="isCustomer" label="Cliente" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><Field component={CheckField} name="isSupplier" label="Fornecedor" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><Field component={CheckField} name="isEmployee" label="Funcionário" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><Field component={CheckField} name="isSeller" label="Vendedor" /></Grid>
                <Grid size={12}><Field component={CheckField} name="isActive" label="Ativo" /></Grid>
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
