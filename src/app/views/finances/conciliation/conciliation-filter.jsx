import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { SelectField } from '@/components/controls';

export default function ConciliationFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    status: filters.status || 'not_conciled'
  };

  const handleClear = (setValues) => {
    const clearedValues = {
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
