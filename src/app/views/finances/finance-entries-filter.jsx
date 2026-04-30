import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, SelectField } from '@/components/controls';

export default function FinanceEntriesFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    documentNumber: filters.documentNumber || '',
    partner: filters.partner || '',
    description: filters.description || '',
    accountPlan: filters.accountPlan || '',
    costCenter: filters.costCenter || '',
    status: filters.status || '',
    installmentNumber: filters.installmentNumber || '',
    installmentValue: filters.installmentValue || ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      documentNumber: '',
      partner: '',
      description: '',
      accountPlan: '',
      costCenter: '',
      status: '',
      installmentNumber: '',
      installmentValue: ''
    };
    setValues(clearedValues);
    onApply(clearedValues);
  };

  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      initialValues={initialValues}
      onApply={onApply}
      onClear={handleClear}
      title="Filtros"
    >
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Field component={TextField} name="documentNumber" label="Nº Doc." fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="partner" label="Fornecedor/Cliente" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="accountPlan" label="Plano de Contas" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="costCenter" label="Centro de Custo" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field
            component={SelectField}
            name="status"
            label="Status"
            fullWidth
            size="small"
            options={[
              { value: 'open', label: 'Em aberto' },
              { value: 'paid', label: 'Recebido' }
            ]}
          />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="installmentNumber" label="Parcela" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="installmentValue" label="Valor" fullWidth size="small" />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
