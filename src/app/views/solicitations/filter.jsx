import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, AutoComplete } from '@/components/controls';
import * as search from "@/libs/search";

export default function SolicitationFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    number: filters.number || '',
    description: filters.description || '',
    status: filters.status || filters.solicitationStatus || null,
    partner: filters.partner || null,
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      number: '',
      description: '',
      status: null,
      partner: null,
    };
    setValues(clearedValues);
    onApply({ ...filters, ...clearedValues });
  };

  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      initialValues={initialValues}
      onApply={(values) => onApply({ ...filters, ...values })}
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
            renderSuggestion={(item) => (
              <span>{item?.CpfCnpj} - {item?.surname}</span>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Field 
            component={AutoComplete} 
            name="status" 
            label="Status" 
            fullWidth 
            size="small"
            text={(item) => item?.description || ''}
            onSearch={(value, signal) => search.solicitationStatus({ search: value }, signal)}
            renderSuggestion={(item) => (
              <span>{item?.description}</span>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Field component={TextField} name="number" label="Número" fullWidth size="small" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Field component={TextField} name="description" label="Descrição" fullWidth size="small" />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
