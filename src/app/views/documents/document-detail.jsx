'use client';

import React from 'react';
import {
  Box,
  Button,
  Divider,
  Typography,
  Grid,
} from '@mui/material';
import { Dialog } from '@/components/common';
import { Formik, Form, Field } from 'formik';
import * as documentAction from '@/app/actions/document.action';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';
import {
  TextField,
  NumericField,
  DateField,
  DateTimeField,
  AutoComplete,
  SelectField
} from '@/components/controls';
import * as search from '@/libs/search';
import { useLoading } from '@/hooks';
import { SectionTable } from '@/components/common';
import { DocumentProductDrawer } from './document-product.drawer';
import { DocumentServiceDrawer } from './document-service.drawer';
import { DocumentFinanceDrawer } from './document-finance.drawer';

export function DocumentDetail({ document, onClose, onSave, documentType, manual = false }) {

  const [data, setData] = React.useState(document || {});
  const loading = useLoading();

  // Synchronize data when document prop changes (data is already fetched by caller)
  React.useEffect(() => {
    setData(document || {});
  }, [document]);

  const [productDrawer, setProductDrawer] = React.useState({ open: false, data: null, index: -1 });
  const [serviceDrawer, setServiceDrawer] = React.useState({ open: false, data: null, index: -1 });
  const [financeDrawer, setFinanceDrawer] = React.useState({ open: false, data: null, index: -1 });

  const handleSubmit = async (values) => {

    if (manual) {
      onSave?.(values);
      onClose?.();
      return;
    }

    loading.show('Salvando...', 'Aguarde um momento');

    try {

      let result;
      const payload = {
        ...values,
        partnerId: values.partner?.id || values.partnerId,
        documentModelId: values.documentModelId || values.documentTypeId
      };

      if (document?.id) {
        result = await documentAction.update(document.id, values);
      } else {
        result = await documentAction.create(payload);
      }

      if (result.header.status === ServiceStatus.SUCCESS) {
        alert.success(document?.id ? 'Documento atualizado com sucesso' : 'Documento criado com sucesso');
        onSave?.(result.body);
        onClose?.();
      } else {
        alert.error('Erro ao salvar', result.body.message);
      }
    } catch (err) {
      alert.error('Erro', 'Erro ao salvar documento');
    } finally {
      loading.hide();
    }
  };

  const initialValues = {
    id: null,
    documentTypeId: '',
    requestTypeId: '',
    partnerId: null,
    partner: null,
    invoiceNumber: '',
    invoiceSerie: '',
    invoiceDate: '',
    receiptDate: '',
    invoiceKey: '',
    invoiceValue: 0,
    totalProductsValue: 0,
    discountValue: 0,
    freightValue: 0,
    insuranceValue: 0,
    otherValues: 0,
    icmsBaseValue: 0,
    icmsValue: 0,
    ipiValue: 0,
    pisValue: 0,
    cofinsValue: 0,
    icmsstBaseValue: 0,
    icmsstValue: 0,
    description: '',
    items: [],
    services: [],
    financeEntries: [],
  };

  const getValues = (data) => ({
    ...initialValues,
    ...data,
    id: data?.id || null,
    partnerId: data?.partnerId || null,
    partner: data?.partner || null,
    documentModelId: data?.documentModelId || data?.documentTypeId || '',
    requestTypeId: data?.requestTypeId || data?.invoiceTypeId || '',
    invoiceDate: data?.invoiceDate || '',
    receiptDate: data?.receiptDate || '',
    invoiceNumber: data?.invoiceNumber || '',
    invoiceValue: data?.invoiceValue || 0,
    totalProductsValue: data?.totalProductsValue || 0,
    discountValue: data?.discountValue || 0,
    freightValue: data?.freightValue || 0,
    insuranceValue: data?.insuranceValue || 0,
    otherValues: data?.otherValues || 0,
    icmsBaseValue: data?.icmsBaseValue || 0,
    icmsValue: data?.icmsValue || 0,
    ipiValue: data?.ipiValue || 0,
    pisValue: data?.pisValue || 0,
    cofinsValue: data?.cofinsValue || 0,
    icmsstBaseValue: data?.icmsstBaseValue || 0,
    icmsstValue: data?.icmsstValue || 0,
    items: data?.items || [],
    services: data?.services || [],
    financeEntries: data?.financeTitle?.entries || [],
  });

  return (
    <Formik
      initialValues={getValues(data)}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ submitForm, values, setFieldValue }) => {
        const handleSaveProduct = (product) => {
          const newItems = [...values.items];
          if (productDrawer.index >= 0) {
            newItems[productDrawer.index] = product;
          } else {
            newItems.push({ ...product, tempId: Date.now() });
          }
          setFieldValue('items', newItems);

          // Auto-calculate Total Products
          const total = newItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.value || 0)), 0);
          setFieldValue('totalProductsValue', total);
        };

        const handleDeleteProduct = (index) => {
          const newItems = values.items.filter((_, i) => i !== index);
          setFieldValue('items', newItems);

          const total = newItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.value || 0)), 0);
          setFieldValue('totalProductsValue', total);
        };

        const handleSaveService = (service) => {
          const newServices = [...(values.services || [])];
          if (serviceDrawer.index >= 0) {
            newServices[serviceDrawer.index] = service;
          } else {
            newServices.push({ ...service, tempId: Date.now() });
          }
          setFieldValue('services', newServices);

          // Update total value if needed, or just let the user specify it
        };

        const handleDeleteService = (index) => {
          const newServices = (values.services || []).filter((_, i) => i !== index);
          setFieldValue('services', newServices);
        };

        const handleSaveFinance = (data) => {
          const newEntries = [...(values.financeEntries || [])];
          if (financeDrawer.index >= 0) {
            newEntries[financeDrawer.index] = data;
          } else if (data.installments && data.installments.length > 0) {
            newEntries.push(...data.installments);
          } else {
            newEntries.push({ ...data, tempId: Date.now() });
          }
          setFieldValue('financeEntries', newEntries);
        };

        const handleDeleteFinance = (index) => {
          const newEntries = (values.financeEntries || []).filter((_, i) => i !== index);
          setFieldValue('financeEntries', newEntries);
        };

        return (
          <Dialog
            open={document !== undefined}
            onClose={onClose}
            title="Documento"
            width="lg"
          >
            <Dialog.Content>
              <Form>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 1.8 }}>
                    <Field
                      name="requestTypeId"
                      component={SelectField}
                      label="Tipo"
                      options={[
                        { value: 1, label: '1 - Entrada' },
                        { value: 2, label: '2 - Saída' },
                      ]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Field
                      name="partner"
                      component={AutoComplete}
                      label={values.requestTypeId === 2 ? 'Cliente' : 'Fornecedor'}
                      fullWidth
                      size="small"
                      text={(item) => item?.surname || item?.name || ''}
                      onSearch={(val, signal) => search.partner({ search: val }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.surname || item?.name} {item?.cpfCnpj ? `(${item.cpfCnpj})` : ''}</span>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="primary">Informações Básicas</Typography>
                  </Grid>
                  <Grid size={{ xs: 8, sm: 1.8 }}>
                    <Field
                      label="Número"
                      name="invoiceNumber"
                      component={TextField}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 1.4 }}>
                    <Field
                      label="Série"
                      name="invoiceSerie"
                      component={TextField}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4.6 }}>
                    <Field
                      label="Chave de acesso"
                      name="invoiceKey"
                      component={TextField}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Field
                      name="invoiceDate"
                      component={DateTimeField}
                      label="Data Emissão"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.8 }}>
                    <Field
                      name="receiptDate"
                      component={DateField}
                      label="Data Entrada"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="primary">Valores e Totais</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="invoiceValue"
                      component={NumericField}
                      label="Valor Total (R$)"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="totalProductsValue"
                      component={NumericField}
                      label="Total Produtos"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="discountValue"
                      component={NumericField}
                      label="Descontos"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="freightValue"
                      component={NumericField}
                      label="Frete"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="insuranceValue"
                      component={NumericField}
                      label="Seguro"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Field
                      name="otherValues"
                      component={NumericField}
                      label="Outras Despesas"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="primary">Impostos</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.8 }}>
                    <Field
                      name="icmsBaseValue"
                      component={NumericField}
                      label="Base ICMS"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="icmsValue"
                      component={NumericField}
                      label="Valor ICMS"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="ipiValue"
                      component={NumericField}
                      label="Valor IPI"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="pisValue"
                      component={NumericField}
                      label="Valor PIS"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="cofinsValue"
                      component={NumericField}
                      label="Valor COFINS"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="icmsstBaseValue"
                      component={NumericField}
                      label="Base ICMS ST"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Field
                      name="icmsstValue"
                      component={NumericField}
                      label="Valor ICMS ST"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field
                      name="description"
                      component={TextField}
                      label="Observações"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2 }}>
                      <SectionTable
                        title="Itens do Documento / Produtos"
                        columns={[
                          { field: 'description', headerName: 'Descrição / Produto', renderCell: (val, row) => row.product?.description || val },
                          { field: 'quantity', headerName: 'Qtd.', renderCell: (val) => Number(val || 0).toLocaleString('pt-BR') },
                          { field: 'value', headerName: 'Vlr. Unit.', renderCell: (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                          { field: 'total', headerName: 'Total', renderCell: (_, row) => (Number(row.quantity || 0) * Number(row.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                        ]}
                        items={values.items || []}
                        onAdd={() => setProductDrawer({ open: true, data: null, index: -1 })}
                        onEdit={(item, index) => setProductDrawer({ open: true, data: item, index })}
                        onDelete={(_, index) => handleDeleteProduct(index)}
                      />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <SectionTable
                        title="Itens do Documento / Serviços"
                        columns={[
                          { field: 'description', headerName: 'Descrição / Serviço', renderCell: (val, row) => row.service?.name || val },
                          { field: 'quantity', headerName: 'Qtd.', renderCell: (val) => Number(val || 0).toLocaleString('pt-BR') },
                          { field: 'value', headerName: 'Vlr. Unit.', renderCell: (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                          { field: 'total', headerName: 'Total', renderCell: (_, row) => (Number(row.quantity || 0) * Number(row.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                        ]}
                        items={values.services || []}
                        onAdd={() => setServiceDrawer({ open: true, data: null, index: -1 })}
                        onEdit={(item, index) => setServiceDrawer({ open: true, data: item, index })}
                        onDelete={(_, index) => handleDeleteService(index)}
                      />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <SectionTable
                        title="Financeiro / Parcelas"
                        columns={[
                          { field: 'installmentNumber', headerName: 'Parcela', width: 80 },
                          { field: 'dueDate', headerName: 'Vencimento', renderCell: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '' },
                          { field: 'installmentValue', headerName: 'Valor', renderCell: (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                          { field: 'description', headerName: 'Descrição', flex: 1 },
                        ]}
                        items={values.financeEntries || []}
                        onAdd={() => setFinanceDrawer({ open: true, data: null, index: -1 })}
                        onEdit={(item, index) => setFinanceDrawer({ open: true, data: item, index })}
                        onDelete={(_, index) => handleDeleteFinance(index)}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <DocumentProductDrawer
                  open={productDrawer.open}
                  initialData={productDrawer.data}
                  onClose={() => setProductDrawer({ open: false, data: null, index: -1 })}
                  onSave={handleSaveProduct}
                />

                <DocumentServiceDrawer
                  open={serviceDrawer.open}
                  initialData={serviceDrawer.data}
                  onClose={() => setServiceDrawer({ open: false, data: null, index: -1 })}
                  onSave={handleSaveService}
                />

                <DocumentFinanceDrawer
                  open={financeDrawer.open}
                  initialData={financeDrawer.data}
                  onClose={() => setFinanceDrawer({ open: false, data: null, index: -1 })}
                  onSave={handleSaveFinance}
                />
              </Form>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
              <Button
                onClick={submitForm}
                variant="contained"
                disabled={loading.isLoading}
                sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                {loading.isLoading && Object.keys(data).length ? 'Salvando...' : 'Salvar'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        );
      }}
    </Formik>
  );
}

