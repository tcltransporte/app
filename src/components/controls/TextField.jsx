'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const TextField = React.forwardRef(({ transform, field, form, onChange, ...props }, ref) => {

  const handleChange = (e) => {

    if (transform === 'uppercase') e.target.value = e.target.value.toUpperCase();
    if (transform === 'lowercase') e.target.value = e.target.value.toLowerCase();

    // Formik integration
    field?.onChange(e);

    onChange?.(e);
  };

  return (
    <MuiTextField
      variant="filled"
      InputLabelProps={{ shrink: true }}
      size="small"
      ref={ref}
      {...field}
      {...props}
      onChange={handleChange}
    />
  );

});