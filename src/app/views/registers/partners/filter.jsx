import { Grid, Typography, Stack } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, CheckField, SelectField } from '@/components/controls';

export function PartnerFilter({ open, onClose, filters, onApply }) {
  const initialValues = {
    id: filters.id || '',
    cpfCnpj: filters.cpfCnpj || '',
    name: filters.name || '',
    surname: filters.surname || '',
    typeId: filters.typeId || '',
    isActive: filters.isActive !== undefined ? String(filters.isActive) : '',
    isCustomer: filters.isCustomer || false,
    isSupplier: filters.isSupplier || false,
    isEmployee: filters.isEmployee || false,
    isSeller: filters.isSeller || false,
  };

  const handleClear = (setValues) => {
    const clearedValues = {
      id: '',
      cpfCnpj: '',
      name: '',
      surname: '',
      typeId: '',
      isActive: '',
      isCustomer: false,
      isSupplier: false,
      isEmployee: false,
      isSeller: false,
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
      title="Filtros de Parceiros"
    >
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Field component={TextField} name="id" label="Código" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="cpfCnpj" label="CPF/CNPJ" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="name" label="Razão Social" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={TextField} name="surname" label="Nome Fantasia" fullWidth size="small" />
        </Grid>
        <Grid size={12}>
          <Field component={SelectField} name="typeId" label="Tipo Pessoa" fullWidth size="small" options={[
            { value: '', label: 'Todos' },
            { value: 1, label: 'Pessoa Física' },
            { value: 2, label: 'Pessoa Jurídica' },
          ]} />
        </Grid>
        <Grid size={12}>
          <Field component={SelectField} name="isActive" label="Status" fullWidth size="small" options={[
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Ativo' },
            { value: 'false', label: 'Inativo' },
          ]} />
        </Grid>

        <Grid size={12}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
            PERFIS
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Field component={CheckField} name="isCustomer" label="Cliente" />
            <Field component={CheckField} name="isSupplier" label="Fornecedor" />
            <Field component={CheckField} name="isEmployee" label="Funcionário" />
            <Field component={CheckField} name="isSeller" label="Vendedor" />
          </Stack>
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
