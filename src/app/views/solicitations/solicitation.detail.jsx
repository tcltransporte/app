'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button, Divider } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, SelectField } from '@/components/controls';
import { SectionItemTable } from './section-item-table';
import { ItemDrawer } from './item-drawer';
import { PaymentDrawer } from './payment-drawer';
import * as solicitationService from '@/app/services/solicitation.service';
import { alert } from '@/libs/alert';

export default function SolicitationDetail({ solicitationId, onClose, onSave, typeHash }) {

  const formikRef = React.useRef(null);
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // Products and Services State (Mocked)
  const [products, setProducts] = React.useState([]);
  const [services, setServices] = React.useState([]);
  const [payments, setPayments] = React.useState([]);

  // Drawer state
  const [drawer, setDrawer] = React.useState({ open: false, type: 'product', item: null });

  React.useEffect(() => {
    if (solicitationId === undefined || solicitationId === null) {
      setData({});
      setProducts([]);
      setServices([]);
      setPayments([]);
      formikRef.current?.resetForm();
      return;
    }

    setLoading(true)
    solicitationService.findOne(solicitationId)
      .then(result => {
        if (result.status === 200) {
          setData(result);
          setProducts(result.products ?? []);
          // Services and payments keep mocked for now as schema wasn't provided for them
          setServices([
            { id: 1, description: 'Mão de Obra Troca Suspensão', quantity: 1, value: 500.00 },
          ]);
          setPayments([
            { id: 1, documentNumber: '541', costCenter: 'Geral', totalValue: 2530.97, installmentsCount: 1, description: 'Pg Aguia Diesel Ltda Nf 541' }
          ]);
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

  const handleSaveItem = async (values) => {
    if (drawer.type === 'product' && solicitationId) {
      setLoading(true)
      try {
        const result = await solicitationService.upsertProduct(solicitationId, values)
        if (result.status === 200) {
          // Refresh products
          const productsResult = await solicitationService.findProducts(solicitationId)
          if (productsResult.status === 200) setProducts(productsResult.items || productsResult.data || productsResult)
          alert.success('Produto salvo!')
        }
      } catch (error) {
        alert.error('Erro ao salvar produto')
      } finally {
        setLoading(false)
      }
      return
    }

    // Fallback for others (mocked)
    let list, setList;
    if (drawer.type === 'product') { list = products; setList = setProducts; }
    else if (drawer.type === 'service') { list = services; setList = setServices; }
    else if (drawer.type === 'payment') { list = payments; setList = setPayments; }

    if (drawer.item) {
      setList(list.map(i => i.id === drawer.item.id ? { ...i, ...values } : i));
    } else {
      setList([...list, { ...values, id: Date.now() }]);
    }
  }

  const handleDeleteItem = async (type, item) => {
    if (type === 'product' && solicitationId && typeof item.id === 'number' && item.id > 10000000) { // Simple check for DB ID vs temp ID
      // If it's a real item, delete from DB
      try {
        await solicitationService.deleteProduct(item.id)
        setProducts(products.filter(i => i.id !== item.id))
        alert.success('Produto excluído!')
      } catch (error) {
        alert.error('Erro ao excluir')
      }
      return
    }

    let list, setList;
    if (type === 'product') { list = products; setList = setProducts; }
    else if (type === 'service') { list = services; setList = setServices; }
    else if (type === 'payment') { list = payments; setList = setPayments; }
    setList(list.filter(i => i.id !== item.id));
  };

  const columns = [
    { field: 'itemId', headerName: 'ID Item', width: 100 },
    { field: 'quantity', headerName: 'Qtd', width: 80, align: 'center' },
    {
      field: 'value', headerName: 'Valor', width: 120, align: 'right',
      renderCell: (val) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      field: 'total', headerName: 'Total', width: 120, align: 'right',
      renderCell: (_, row) => (row.quantity * row.value)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { field: 'vehicleId', headerName: 'Veículo', width: 100 },
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

                  {/* Products Section */}
                  <Grid size={12}>
                    <SectionItemTable
                      title="Produtos"
                      columns={columns}
                      items={products}
                      onAdd={() => handleOpenDrawer('product')}
                      onEdit={(item) => handleOpenDrawer('product', item)}
                      onDelete={(item) => handleDeleteItem('product', item)}
                      actions={[{ label: 'Listar Peças', onClick: () => console.log('Listar Peças') }]}
                    />
                  </Grid>

                  {/* Services Completed Section */}
                  <Grid size={12}>
                    <SectionItemTable
                      title="Serviços"
                      columns={columns}
                      items={services}
                      onAdd={() => handleOpenDrawer('service')}
                      onEdit={(item) => handleOpenDrawer('service', item)}
                      onDelete={(item) => handleDeleteItem('service', item)}
                    />
                  </Grid>

                  {/* Payment Methods Section */}
                  <Grid size={12}>
                    <SectionItemTable
                      title="Pagamento"
                      columns={paymentColumns}
                      items={payments}
                      onAdd={() => handleOpenDrawer('payment')}
                      onEdit={(item) => handleOpenDrawer('payment', item)}
                      onDelete={(item) => handleDeleteItem('payment', item)}
                    />
                  </Grid>

                  <Grid size={12} sx={{ my: 1 }}><Divider /></Grid>

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
                  {/*
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={TextField} name="sellerId" label="ID Vendedor" fullWidth size="small" type="number" />
                  </Grid>x

                  <Grid size={12}>
                    <Field component={TextField} name="tributationId" label="Tributação (UUID)" fullWidth size="small" />
                  </Grid>*/}
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
          initialValues={drawer.item || { itemId: '', quantity: 1, value: 0, vehicleId: '', supplierId: '' }}
          onSave={handleSaveItem}
        />
      )}
    </>
  );
}
