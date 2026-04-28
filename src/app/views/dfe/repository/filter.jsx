'use client';

import React from 'react';
import { Grid } from '@mui/material';
import { Field } from 'formik';
import { FilterDrawer } from '@/components/common';
import { TextField } from '@/components/controls';

const FILTER_FIELDS = {
  numeroDoc: '',
  chNFe: '',
  cnpj: '',
  xNome: '',
  vNF: '',
};

export default function DistributionFilter({ open, filters, onClose, onApply }) {
  const initialValues = {
    numeroDoc: filters.numeroDoc ?? FILTER_FIELDS.numeroDoc,
    chNFe: filters.chNFe ?? FILTER_FIELDS.chNFe,
    cnpj: filters.cnpj ?? FILTER_FIELDS.cnpj,
    xNome: filters.xNome ?? FILTER_FIELDS.xNome,
    vNF: filters.vNF ?? FILTER_FIELDS.vNF,
  };

  const handleClear = (setValues) => {
    setValues(FILTER_FIELDS);
    onApply({ ...FILTER_FIELDS });
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
          <Field component={TextField} name="numeroDoc" label="Nº NF" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field
            component={TextField}
            name="chNFe"
            label="Chave de acesso (parcial ou 44 dígitos)"
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="cnpj" label="CNPJ" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field component={TextField} name="xNome" label="Razão Social" fullWidth size="small" />
        </Grid>
        <Grid item size={12}>
          <Field
            component={TextField}
            name="vNF"
            label="Valor (ex.: 320 ou 320,50 — igualdade)"
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
    </FilterDrawer>
  );
}
