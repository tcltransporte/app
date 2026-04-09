'use client';

import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Grid, Button, Box } from '@mui/material';
import { Dialog } from '@/components/common';
import { TextField, AutoComplete, DatePicker } from '@/components/controls';
import { SectionTable } from '@/components/common/SectionTable';
import { PaymentDrawer } from '@/app/views/solicitations/payment-drawer';
import * as financeAction from '@/app/actions/finance.action';
import { alert } from '@/libs/alert';
import * as search from "@/libs/search";
import { ServiceStatus } from '@/libs/service';

export default function FinanceTitleDrawer({ open, operationType, onClose, onSave }) {
  const formikRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);

  // Drawer for nested parcels
  const [entryDrawer, setEntryDrawer] = React.useState({ open: false, item: null, index: -1 });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        partnerId: values.partner?.id,
        accountPlanId: values.accountPlan?.id,
        documentNumber: values.documentNumber,
        totalValue: values.totalValue,
        movementDate: values.movementDate,
        description: values.description,
        operationType: operationType,
        entries: values.entries.map((e, index) => ({
          installmentNumber: index + 1,
          installmentValue: e.value || e.installmentValue,
          dueDate: e.dueDate,
          systemDate: new Date(),
          description: e.description
        }))
      };

      const result = await financeAction.create(payload);

      if (result.header?.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      alert.success('Salvo com sucesso!');
      onSave?.();
      onClose?.();

    } catch (error) {
      alert.error('Erro ao salvar', error?.body?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (item = null, index = -1) => {
    setEntryDrawer({ open: true, item, index });
  };

  const handleSaveEntry = (values) => {
    const list = formikRef.current?.values.entries || [];
    let newList;

    if (entryDrawer.index !== undefined && entryDrawer.index >= 0) {
      newList = [...list];
      newList[entryDrawer.index] = { ...newList[entryDrawer.index], ...values, value: values.value };
    } else {
      if (values.installments && values.installments.length > 0) {
        const newInstallments = values.installments.map(inst => ({
          ...values,
          ...inst,
          value: parseFloat(inst.value)
        }));
        newList = [...list, ...newInstallments];
      } else {
        newList = [...list, { ...values }];
      }
    }

    formikRef.current?.setFieldValue('entries', newList);
    
    // Auto calculate total value
    const total = newList.reduce((sum, item) => sum + (parseFloat(item.value || item.installmentValue) || 0), 0);
    formikRef.current?.setFieldValue('totalValue', total);
  };

  const handleDeleteEntry = (item, index) => {
    const list = formikRef.current?.values.entries || [];
    const newList = [...list];
    newList.splice(index, 1);
    formikRef.current?.setFieldValue('entries', newList);
    
    // Auto calculate total value
    const total = newList.reduce((sum, e) => sum + (parseFloat(e.value || e.installmentValue) || 0), 0);
    formikRef.current?.setFieldValue('totalValue', total);
  };

  const entryColumns = [
    {
      field: 'dueDate', headerName: 'Vencimento', width: 150,
      renderCell: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : ''
    },
    {
      field: 'value', headerName: 'Valor', width: 150, align: 'right',
      renderCell: (val, row) => (val || row.installmentValue)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { field: 'description', headerName: 'Descrição' },
  ];

  return (
    <>
      <Formik
        innerRef={formikRef}
        enableReinitialize
        initialValues={{
          documentNumber: '',
          partner: null,
          accountPlan: null,
          movementDate: new Date(),
          totalValue: 0,
          description: '',
          entries: []
        }}
        onSubmit={handleSubmit}
      >
        {({ submitForm, values }) => (
          <Dialog
            open={open}
            loading={loading}
            title={operationType === 1 ? 'Adicionar Contas a Pagar' : 'Adicionar Contas a Receber'}
            onClose={onClose}
            width="800px"
          >
            <Dialog.Content>
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Field
                      component={AutoComplete}
                      name="partner"
                      label="Fornecedor / Cliente"
                      text={(partner) => `${partner.surname}`}
                      onSearch={(value, signal) => search.partner({ search: value }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.CpfCnpj} - {item?.surname}</span>
                      )}
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={TextField} name="documentNumber" label="Nº Documento" required />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field component={DatePicker} name="movementDate" label="Data de Lançamento" required />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Field
                      component={AutoComplete}
                      name="accountPlan"
                      label="Plano de Contas"
                      text={(plan) => `${plan.code || plan.codigo} - ${plan.description}`}
                      onSearch={(value, signal) => search.accountPlan({ search: value, operationType }, signal)}
                      renderSuggestion={(item) => (
                        <span>{item?.code || item?.codigo} - {item?.description}</span>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Field component={TextField} name="description" label="Histórico / Observação" />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Field 
                      component={TextField} 
                      name="totalValue" 
                      label="Valor Total" 
                      type="number"
                      InputProps={{
                        startAdornment: 'R$ '
                      }}
                      readOnly
                    />
                  </Grid>

                  {/* Entries Section */}
                  <Grid size={12}>
                    <Field name="entries">
                      {({ field }) => (
                        <SectionTable
                          title="Parcelas"
                          columns={entryColumns}
                          items={field.value}
                          onAdd={() => handleOpenDrawer()}
                          onEdit={(item, index) => handleOpenDrawer(item, index)}
                          onDelete={(item, index) => handleDeleteEntry(item, index)}
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
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        )}
      </Formik>

      <PaymentDrawer
        open={entryDrawer.open}
        onClose={() => setEntryDrawer({ ...entryDrawer, open: false })}
        initialValues={entryDrawer.item}
        onSave={handleSaveEntry}
      />
    </>
  );
}
