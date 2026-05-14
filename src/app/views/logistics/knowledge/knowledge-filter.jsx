import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField } from '@/components/controls';

export default function KnowledgeFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    search: filters.search || '',
    ctNumber: filters.ctNumber || '',
    ctKey: filters.ctKey || '',
    statusCode: filters.statusCode || '',
    movementId: filters.movementId || '',
    description: filters.description || ''
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      search: '',
      ctNumber: '',
      ctKey: '',
      statusCode: '',
      movementId: '',
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
            name="ctNumber"
            label="Número CT-e"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="statusCode"
            label="Status SEFAZ (cStat)"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <Field
            component={TextField}
            name="ctKey"
            label="Chave CT-e"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            component={TextField}
            name="movementId"
            label="ID Movimento"
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
