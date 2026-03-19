import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, SelectField, AutoComplete } from '@/components/controls';
import * as search from "@/libs/search";

export default function SolicitationFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    number: filters.number || '',
    description: filters.description || '',
    statusId: filters.statusId || '',
    typeId: filters.typeId || '',
    partnerId: filters.partnerId || '',
    partner: filters.partner || null,
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      number: '',
      description: '',
      statusId: '',
      typeId: '',
      partnerId: '',
      partner: null,
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
      title="Filtros de Solicitações"
    >
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
          <Field 
            component={AutoComplete} 
            name="partner" 
            label="Fornecedor" 
            fullWidth 
            size="small"
            text={(item) => item?.surname || ''}
            onSearch={(value, signal) => search.partner({ search: value, isSupplier: true }, signal)}
            onChange={(val, form) => {
              form.setFieldValue('partnerId', val?.id || '');
            }}
            renderSuggestion={(item) => (
              <span>{item?.CpfCnpj} - {item?.surname}</span>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Field component={TextField} name="number" label="Número" fullWidth size="small" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Field component={SelectField} name="statusId" label="Status" fullWidth size="small" options={[
            { value: '', label: 'Todos' },
            { value: 1, label: 'Pendente' },
            { value: 2, label: 'Em Andamento' },
            { value: 3, label: 'Concluído' },
            { value: 4, label: 'Cancelado' },
          ]} />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
