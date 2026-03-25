'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button, Box, InputAdornment } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, AutoComplete } from '@/components/controls';
import { SectionTable } from '@/components/common/SectionTable';
import { ProductDrawer } from './product-drawer';
import { ServiceDrawer } from './service-drawer';
import { PaymentDrawer } from './payment-drawer';
import * as solicitationService from '@/app/services/solicitation.service';
import { alert } from '@/libs/alert';

import * as search from "@/libs/search";
import { ServiceStatus } from '@/libs/service';

export default function SolicitationDetail({ solicitationId, onClose, onSave, solicitationType }) {

  const formikRef = React.useRef(null);
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // Drawer state
  const [drawer, setDrawer] = React.useState({ open: false, type: 'product', item: null, index: -1 });

  React.useEffect(() => {

    if (solicitationId === undefined || solicitationId === null) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }

    setLoading(true)
    solicitationService.findOne(solicitationId)
      .then(result => {

        console.log(result)

        if (result.header.status !== ServiceStatus.SUCCESS) {
          throw result
        }

        setData(result.body);

      })
      .catch((error) => {
        alert.error('Erro ao buscar solicitação', error?.header?.message || error.message);
      })
      .finally(() => setLoading(false))
  }, [solicitationId])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {

      const payload = { ...values };

      if (payload.partner) {
        payload.partnerId = payload.partner.id;
      }

      if (solicitationType && !solicitationId) {
        payload.typeId = solicitationType.id;
      }

      let result
      if (solicitationId) {
        result = await solicitationService.update(Number(solicitationId), payload)
      } else {
        result = await solicitationService.create(payload)
      }

      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result
      }

      alert.success('Salvo com sucesso!');
      onSave?.();
      onClose?.();

    } catch (error) {
      alert.error('Erro ao salvar', error?.header?.message || error.message);
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDrawer = (type, item = null, index = -1) => {
    setDrawer({ open: true, type, item, index });
  }

  const handleSaveItem = (values) => {

    const fieldName = drawer.type === 'product' ? 'products' : drawer.type === 'service' ? 'services' : 'payments';
    const list = formikRef.current?.values[fieldName] || [];

    let newList;
    if (drawer.index !== undefined && drawer.index >= 0) {
      // Update existing item in local list (match by index)
      newList = [...list];
      newList[drawer.index] = { ...newList[drawer.index], ...values };
    } else {
      // Add new item without temporary ID
      newList = [...list, { ...values }];
    }

    formikRef.current?.setFieldValue(fieldName, newList);
  }

  const handleSavePayment = (values) => {
    const list = formikRef.current?.values.payments || [];
    let newList;

    if (drawer.index !== undefined && drawer.index >= 0) {
      // Editing a single installment
      newList = [...list];
      newList[drawer.index] = { ...newList[drawer.index], ...values };
    } else {
      // Adding new payment (possibly multiple installments)
      const commonData = {
        documentNumber: values.documentNumber,
        costCenterId: values.costCenterId, // This might be in the installment instead
        description: values.description,
        issueDate: values.issueDate,
      };

      const newInstallments = values.installments.map(inst => ({
        ...commonData,
        ...inst,
        // Ensure decimal values are numbers
        value: parseFloat(inst.value)
      }));

      newList = [...list, ...newInstallments];
    }

    formikRef.current?.setFieldValue('payments', newList);
  }

  const handleDeleteItem = (type, item, index) => {
    const fieldName = type === 'product' ? 'products' : type === 'service' ? 'services' : 'payments';
    const list = formikRef.current?.values[fieldName] || [];
    const newList = [...list];
    newList.splice(index, 1);
    formikRef.current?.setFieldValue(fieldName, newList);
  };

  const columns = [
    {
      field: 'itemId',
      headerName: 'Descrição',
      width: 250,
      renderCell: (val, row) => row.product?.name || row.service?.name
    },
    { field: 'quantity', headerName: 'Qtd', width: 80, align: 'center' },
    {
      field: 'value', headerName: 'Valor', width: 120, align: 'right',
      renderCell: (val) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      field: 'total', headerName: 'Total', width: 120, align: 'right',
      renderCell: (_, row) => (row.quantity * row.value)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  ];

  const paymentColumns = [
    { field: 'documentNumber', headerName: 'Número Doc.' },
    {
      field: 'dueDate',
      headerName: 'Vencimento',
      width: 120,
      renderCell: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : ''
    },
    {
      field: 'value',
      headerName: 'Valor',
      width: 130,
      align: 'right',
      renderCell: (val) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { field: 'description', headerName: 'Descrição' },
  ];

  return (
    <>
      <Formik
        innerRef={formikRef}
        enableReinitialize
        initialValues={{
          description: data?.description ?? '',
          number: data?.number ?? '',
          statusId: data?.statusId ?? '',
          typeId: data?.typeId ?? (solicitationType?.id || ''),
          partner: data?.partner ?? null,
          products: data?.products ?? [],
          services: data?.services ?? [],
          payments: data?.payments ?? [],
        }}
        onSubmit={handleSubmit}
      >
        {({ submitForm }) => (
          <Dialog
            open={solicitationId !== undefined}
            loading={loading && !Object.keys(data).length}
            title={solicitationId === null ? 'Nova solicitação' : `Editar solicitação: ${data?.number || ''}`}
            onClose={onClose}
            width="1000px"
          >
            <Dialog.Content>
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <Field component={TextField} name="number" label="Número" readOnly />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field
                      component={AutoComplete}
                      name="partner"
                      label="Fornecedor"
                      text={(partner) => `${partner.surname}`}
                      onSearch={(value, signal) => search.partner({ search: value, isSupplier: true }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.CpfCnpj} - {item?.surname}</span>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Field
                      component={TextField}
                      name="status"
                      label="Status"
                      fullWidth
                      readOnly
                      value={data?.solicitationStatus?.description || 'Pendente'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1.5, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: (theme) => {
                                  const statusId = data?.statusId;
                                  const colors = {
                                    1: theme.palette.warning.main,    // Pendente
                                    2: theme.palette.info.main,       // Em Aprovação
                                    3: theme.palette.success.main,    // Aprovada
                                    4: theme.palette.error.main,      // Rejeitada
                                    5: theme.palette.grey[500],       // Cancelada
                                  };
                                  return colors[statusId] || theme.palette.warning.main;
                                },
                                "@keyframes pulse": {
                                  "0%": { transform: "scale(1)", opacity: 1 },
                                  "50%": { transform: "scale(1.4)", opacity: 0.6 },
                                  "100%": { transform: "scale(1)", opacity: 1 }
                                },
                                animation: "pulse 2s infinite ease-in-out"
                              }}
                            />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Products Section */}
                  <Grid size={12}>
                    <Field name="products">
                      {({ field }) => (
                        <SectionTable
                          title="Produtos"
                          columns={columns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('product')}
                          onEdit={(item, index) => handleOpenDrawer('product', item, index)}
                          onDelete={(item, index) => handleDeleteItem('product', item, index)}
                        />
                      )}
                    </Field>
                  </Grid>

                  {/* Services Completed Section */}
                  <Grid size={12}>
                    <Field name="services">
                      {({ field }) => (
                        <SectionTable
                          title="Serviços"
                          columns={columns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('service')}
                          onEdit={(item, index) => handleOpenDrawer('service', item, index)}
                          onDelete={(item, index) => handleDeleteItem('service', item, index)}
                        />
                      )}
                    </Field>
                  </Grid>

                  {/* Payment Methods Section */}
                  <Grid size={12}>
                    <Field name="payments">
                      {({ field }) => (
                        <SectionTable
                          title="Pagamento"
                          columns={paymentColumns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('payment')}
                          onEdit={(item, index) => handleOpenDrawer('payment', item, index)}
                          onDelete={(item, index) => handleDeleteItem('payment', item, index)}
                        />
                      )}
                    </Field>
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

      <ProductDrawer
        open={drawer.open && drawer.type === 'product'}
        onClose={() => setDrawer({ ...drawer, open: false })}
        initialValues={drawer.item}
        onSave={handleSaveItem}
      />

      <ServiceDrawer
        open={drawer.open && drawer.type === 'service'}
        onClose={() => setDrawer({ ...drawer, open: false })}
        initialValues={drawer.item}
        onSave={handleSaveItem}
      />

      <PaymentDrawer
        open={drawer.open && drawer.type === 'payment'}
        onClose={() => setDrawer({ ...drawer, open: false })}
        initialValues={drawer.item}
        onSave={handleSavePayment}
      />
    </>
  );
}
