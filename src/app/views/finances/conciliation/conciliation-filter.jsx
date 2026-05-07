import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { AutoComplete, NumericField, SelectField, TextField } from '@/components/controls';
import * as search from '@/libs/search';

export default function ConciliationFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    company: (filters.company && typeof filters.company === 'object') ? filters.company : null,
    documentNumber: filters.documentNumber || '',
    description: filters.description || '',
    value: filters.value ?? '',
    bankAccount: (filters.bankAccount && typeof filters.bankAccount === 'object') ? filters.bankAccount : null,
    status: filters.status || 'not_conciled'
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      company: null,
      documentNumber: '',
      description: '',
      value: '',
      bankAccount: null,
      status: 'not_conciled'
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
      title="Filtros de Conciliação"
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
          <Field
            component={AutoComplete}
            name="bankAccount"
            label="Conta bancária"
            text={(v) => `${v?.description || ''} (${v?.bankName || ''})`}
            onSearch={(value, signal) => search.bankAccount({ search: value }, signal)}
            renderSuggestion={(v) => `${v?.description || ''} (${v?.bankName || ''})`}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={TextField}
            name="documentNumber"
            label="Nº Doc"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={TextField}
            name="description"
            label="Descrição"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={NumericField}
            name="value"
            label="Valor"
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
              { value: 'not_conciled', label: 'Pendente' },
              { value: 'conciled', label: 'Conciliado' }
            ]}
          />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
