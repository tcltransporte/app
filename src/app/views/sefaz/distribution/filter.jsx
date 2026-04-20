'use client';

import React from 'react';
import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField, SelectField } from '@/components/controls';

export default function DistributionFilter({ open, filters, onClose, onApply }) {
  const initialValues = {
    nsu: filters.nsu || '',
    idSchema: filters.idSchema || '',
    cnpj: filters.cnpj || '',
    xNome: filters.xNome || '',
    vNF: filters.vNF || '',
    isUnPack: (filters.isUnPack !== undefined && filters.isUnPack !== null && filters.isUnPack !== '') ? String(filters.isUnPack) : ''
  };

  const handleClear = (setValues) => {
    const cleared = { nsu: '', idSchema: '', cnpj: '', xNome: '', vNF: '', isUnPack: '' };
    setValues(cleared);
    onApply(cleared);
  };

  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      initialValues={initialValues}
      onApply={onApply}
      onClear={handleClear}
    >
      <Grid container spacing={2}>
        <Grid item size={12}>
          <Field component={TextField} name="nsu" label="NSU" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="idSchema" label="ID Schema" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="cnpj" label="CNPJ (resNFe)" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="xNome" label="Razão Social (resNFe)" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="vNF" label="Valor (resNFe)" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field
            component={SelectField}
            name="isUnPack"
            label="Descompactado"
            fullWidth
            size="small"
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Sim' },
              { value: 'false', label: 'Não' }
            ]}
          />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
