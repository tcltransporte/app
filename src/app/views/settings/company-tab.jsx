'use client';

import React from 'react';
import { Box, Grid, Typography, Button, Avatar, IconButton, Paper, InputAdornment } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField, AutoComplete } from '@/components/controls';
import * as search from '@/libs/search';

export function CompanyTab({ company, onSave }) {
  return (
    <Formik
      initialValues={{
        cnpj: company?.cnpj || '',
        name: company?.name || '',
        surname: company?.surname || '',
        zipCode: company?.zipCode || '',
        street: company?.street || '',
        number: company?.number || '',
        district: company?.district || '',
        city: company?.city || null,
        state: company?.state || null,
      }}
      onSubmit={onSave}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Logo Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={company?.logo ? `data:image/png;base64,${company.logo}` : ''}
                sx={{ width: 80, height: 80, border: '1px solid', borderColor: 'divider' }}
              />
              <Button
                variant="text"
                startIcon={<EditIcon />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Alterar logo
              </Button>
            </Box>

            {/* Dados Gerais Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Dados gerais
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="cnpj" label="CNPJ" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="surname" label="Razão social" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="name" label="Nome fantasia" fullWidth />
                </Grid>
              </Grid>
            </Box>

            {/* Endereço Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Endereço
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Field
                    component={TextField}
                    name="zipCode"
                    label="CEP"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <LocationIcon fontSize="small" color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Field component={TextField} name="street" label="Logradouro" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Field component={TextField} name="number" label="Número" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field component={TextField} name="complement" label="Complemento" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field component={TextField} name="district" label="Bairro" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    component={AutoComplete}
                    name="state"
                    label="Estado"
                    text={(item) => item?.name || ''}
                    onSearch={(query, signal) => search.state({ search: query }, signal)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    component={AutoComplete}
                    name="city"
                    label="Cidade"
                    text={(item) => item?.name || ''}
                    onSearch={(query, signal) => search.city({ search: query, stateId: values.state?.id }, signal)}
                    disabled={!values.state}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Save Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ px: 4, py: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Salvar
              </Button>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
}
