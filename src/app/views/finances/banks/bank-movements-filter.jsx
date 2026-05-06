import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { NumericField, TextField } from '@/components/controls';

export default function BankMovementsFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    documentNumber: filters.documentNumber || '',
    description: filters.description || '',
    value: filters.value ?? ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      documentNumber: '',
      description: '',
      value: ''
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
      </Grid>
    </FilterDrawer>
  );
}
