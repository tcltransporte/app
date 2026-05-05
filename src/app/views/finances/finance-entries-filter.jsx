import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, SelectField, AutoComplete, NumericField } from '@/components/controls';
import * as search from '@/libs/search';

export default function FinanceEntriesFilter({ open, onClose, filters, onApply, operationType }) {
  const paidStatusLabel = Number(operationType) === 2 ? 'Pago' : 'Recebido';
  const initialValues = {
    company: filters.company || null,
    documentNumber: filters.documentNumber || '',
    invoiceNumber: filters.invoiceNumber || '',
    partner: (filters.partner && typeof filters.partner === 'object') ? filters.partner : null,
    description: filters.description || '',
    accountPlan: (filters.accountPlan && typeof filters.accountPlan === 'object') ? filters.accountPlan : null,
    costCenter: (filters.costCenter && typeof filters.costCenter === 'object') ? filters.costCenter : null,
    status: filters.status || '',
    installmentValue: filters.installmentValue || ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      company: null,
      documentNumber: '',
      invoiceNumber: '',
      partner: null,
      description: '',
      accountPlan: null,
      costCenter: null,
      status: '',
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
          <Field
            component={AutoComplete}
            name="company"
            label="Filial"
            text={(v) => v?.surname || v?.name || ''}
            onSearch={search.company}
            renderSuggestion={(v) => v?.surname || v?.name || ''}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="documentNumber"
            label="Nº Doc."
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field component={TextField} name="invoiceNumber" label="Número Fatura" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field
            component={AutoComplete}
            name="partner"
            label="Fornecedor/Cliente"
            text={(v) => {
              const id = v?.id ?? ''
              const name = v?.surname || v?.name || ''
              const cnpj = v?.cpfCnpj || v?.CpfCnpj || ''
              return `${id} - ${name}${cnpj ? ` - ${cnpj}` : ''}`
            }}
            onSearch={(value, signal) => search.partner({ search: value, isEmployee: true, isCustomer: true, isSupplier: true }, signal)}
            renderSuggestion={(v) => {
              const id = v?.id ?? ''
              const name = v?.surname || v?.name || ''
              const cnpj = v?.cpfCnpj || v?.CpfCnpj || ''
              return `${id} - ${name}${cnpj ? ` - ${cnpj}` : ''}`
            }}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field
            component={AutoComplete}
            name="accountPlan"
            label="Plano de Contas"
            text={(v) => `${v?.code || v?.codigo || ''} - ${v?.description || v?.Descricao || ''}`}
            onSearch={(value, signal) => search.accountPlan({ search: value }, signal)}
            renderSuggestion={(v) => `${v?.code || v?.codigo || ''} - ${v?.description || v?.Descricao || ''}`}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={AutoComplete}
            name="costCenter"
            label="Centro de Custo"
            text={(v) => v?.description || v?.Descricao || ''}
            onSearch={(value, signal) => search.costCenter({ search: value }, signal)}
            renderSuggestion={(v) => v?.description || v?.Descricao || ''}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={SelectField}
            name="status"
            label="Status"
            placeholder="[Todos]"
            fullWidth
            size="small"
            options={[
              { value: 'open', label: 'Em aberto' },
              { value: 'paid', label: paidStatusLabel }
            ]}
          />
        </Grid>
        <Grid size={12}>
          <Field component={NumericField} name="installmentValue" label="Valor" fullWidth size="small" />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
