'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

const toDisplay = (value) => {
  const cents = Math.round(Math.abs(Number(value) * 100));
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const NumericField = React.forwardRef(({ field, form, onChange, ...props }, ref) => {

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) / 100;

    // Formik integration
    field?.onChange({ target: { name: field.name, value: num } });

    onChange?.(num);
  };

  return (
    <MuiTextField
      variant="filled"
      InputLabelProps={{ shrink: true }}
      ref={ref}
      {...field}
      {...props}
      value={toDisplay(field?.value ?? props.value ?? 0)}
      onChange={handleChange}
      inputProps={{ inputMode: 'numeric', ...props.inputProps }}
    />
  );

});
