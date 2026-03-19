'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button, Divider } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, SelectField, AutoComplete } from '@/components/controls';
import { SectionItemTable } from './section-item-table';
import { ItemDrawer } from './item-drawer';
import { PaymentDrawer } from './payment-drawer';
import * as solicitationService from '@/app/services/solicitation.service';
import { alert } from '@/libs/alert';

import * as search from "@/libs/search";

export default function SolicitationDetail({ solicitationId, onClose, onSave, typeHash }) {

  const formikRef = React.useRef(null);
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // Drawer state
  const [drawer, setDrawer] = React.useState({ open: false, type: 'product', item: null });

  React.useEffect(() => {
    if (solicitationId === undefined || solicitationId === null) {
      setData({});
      formikRef.current?.resetForm();
      return;
    }

    setLoading(true)
    solicitationService.findOne(solicitationId)
      .then(result => {
        if (result.status === 200) {
          setData(result);
        }
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

  const handleOpenDrawer = (type, item = null) => {
    setDrawer({ open: true, type, item });
  }

  const handleSaveItem = (values) => {

    const fieldName = drawer.type === 'product' ? 'products' : drawer.type === 'service' ? 'services' : 'payments';
    const list = formikRef.current?.values[fieldName] || [];

    let newList;
    if (drawer.item) {
      // Update existing item in local list (match by ID)
      newList = list.map(i => i.id === drawer.item.id ? { ...i, ...values } : i);
    } else {
      // Add new item with temporary ID
      newList = [...list, { ...values, id: Date.now() }];
    }

    formikRef.current?.setFieldValue(fieldName, newList);
  }

  const handleDeleteItem = (type, item) => {
    const fieldName = type === 'product' ? 'products' : type === 'service' ? 'services' : 'payments';
    const list = formikRef.current?.values[fieldName] || [];
    formikRef.current?.setFieldValue(fieldName, list.filter(i => i.id !== item.id));
  };

  const columns = [
    {
      field: 'itemId',
      headerName: 'Produto',
      width: 250,
      renderCell: (val, row) => row.product?.description || row.product?.name || val
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
    { field: 'costCenter', headerName: 'Centro de Custo' },
    { field: 'installmentsCount', headerName: 'Parc.', width: 80, align: 'center' },
    {
      field: 'totalValue', headerName: 'Valor Total', width: 150, align: 'right',
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
          products: data.products ?? [],
          services: data.services ?? [],
          payments: data.payments ?? [],
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
                    <Field component={TextField} name="number" label="Número" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Field
                      component={AutoComplete}
                      name="receiver"
                      label="Fornecedor"
                      text={(receiver) => `${receiver.surname}`}
                      onSearch={(value, signal) => search.partner({ search: value, isSupplier: true }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.CpfCnpj} - {item?.surname}</span>
                      )}
                    />
                  </Grid>

                  {/* Products Section */}
                  <Grid size={12}>
                    <Field name="products">
                      {({ field }) => (
                        <SectionItemTable
                          title="Produtos"
                          columns={columns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('product')}
                          onEdit={(item) => handleOpenDrawer('product', item)}
                          onDelete={(item) => handleDeleteItem('product', item)}
                        //actions={[{ label: 'Listar Peças', onClick: () => console.log('Listar Peças') }]}
                        />
                      )}
                    </Field>
                  </Grid>

                  {/* Services Completed Section */}
                  <Grid size={12}>
                    <Field name="services">
                      {({ field }) => (
                        <SectionItemTable
                          title="Serviços"
                          columns={columns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('service')}
                          onEdit={(item) => handleOpenDrawer('service', item)}
                          onDelete={(item) => handleDeleteItem('service', item)}
                        />
                      )}
                    </Field>
                  </Grid>

                  {/* Payment Methods Section */}
                  <Grid size={12}>
                    <Field name="payments">
                      {({ field }) => (
                        <SectionItemTable
                          title="Pagamento"
                          columns={paymentColumns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer('payment')}
                          onEdit={(item) => handleOpenDrawer('payment', item)}
                          onDelete={(item) => handleDeleteItem('payment', item)}
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

      {drawer.type === 'payment' ? (
        <PaymentDrawer
          open={drawer.open}
          onClose={() => setDrawer({ ...drawer, open: false })}
          initialValues={drawer.item}
          onSave={handleSaveItem}
        />
      ) : (
        <ItemDrawer
          open={drawer.open}
          onClose={() => setDrawer({ ...drawer, open: false })}
          title={drawer.type === 'product' ? 'Produto' : 'Serviço'}
          initialValues={drawer.item ? { ...drawer.item, product: drawer.item.product || drawer.item.service } : { itemId: '', quantity: 1, value: 0, vehicleId: '', supplierId: '' }}
          onSave={handleSaveItem}
        />
      )}
    </>
  );
}
