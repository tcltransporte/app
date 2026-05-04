import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, SelectField, AutoComplete } from '@/components/controls';
import * as search from '@/libs/search';

export default function FinanceEntriesFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    company: filters.company || null,
    documentNumber: filters.documentNumber || '',
    partner: (filters.partner && typeof filters.partner === 'object') ? filters.partner : null,
    description: filters.description || '',
    accountPlan: (filters.accountPlan && typeof filters.accountPlan === 'object') ? filters.accountPlan : null,
    costCenter: (filters.costCenter && typeof filters.costCenter === 'object') ? filters.costCenter : null,
    status: filters.status || '',
    installmentNumber: filters.installmentNumber || '',
    installmentValue: filters.installmentValue || ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      company: null,
      documentNumber: '',
      partner: null,
      description: '',
      accountPlan: null,
      costCenter: null,
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
        <Grid size={12}>
          <Field component={TextField} name="documentNumber" label="Nº Doc." fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field
            component={AutoComplete}
            name="partner"
            label="Fornecedor/Cliente"
            text={(v) => v?.surname || v?.name || ''}
            onSearch={(value, signal) => search.partner({ search: value }, signal)}
            renderSuggestion={(v) => v?.surname || v?.name || ''}
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
