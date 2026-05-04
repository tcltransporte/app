'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const NumericField = React.forwardRef((props, ref) => {
  const { field, form, onChange, precision = 2, ...rest } = props;
  const factor = Math.pow(10, precision);

  const toDisplay = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const val = Number(value);
    if (Number.isNaN(val)) return '';
    return val.toLocaleString('pt-BR', { 
      minimumFractionDigits: precision, 
      maximumFractionDigits: precision 
    });
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? null : Number(raw) / factor;

    // Formik integration
    if (field) {
      field.onChange({ target: { name: field.name, value: num } });
    }

    onChange?.(num);
  };

  const val = field?.value ?? props.value ?? 0;

  return (
    <MuiTextField
      variant="filled"
      fullWidth
      size="small"
      InputLabelProps={{ shrink: true }}
      ref={ref}
      {...field}
      {...rest}
      value={toDisplay(val)}
      onChange={handleChange}
      inputProps={{ inputMode: 'numeric', ...props.inputProps }}
    />
  );

});
