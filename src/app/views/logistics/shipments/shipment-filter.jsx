import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField } from '@/components/controls';

export default function ShipmentFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    search: filters.search || '',
    tripId: filters.tripId || '',
    transportDocumentId: filters.transportDocumentId || '',
    customerId: filters.customerId || '',
    description: filters.description || ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      search: '',
      tripId: '',
      transportDocumentId: '',
      customerId: '',
      description: ''
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
            name="search"
            label="Pesquisa geral"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="tripId"
            label="Viagem"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="transportDocumentId"
            label="Doc. transporte"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="customerId"
            label="Cód. remetente"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="description"
            label="Descrição"
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
