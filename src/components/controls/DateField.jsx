'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const DateField = React.forwardRef(({ field, form, onChange, ...props }, ref) => {

  const handleChange = (e) => {
    field?.onChange(e);
    onChange?.(e.target.value);
  };

  return (
    <MuiTextField
      type="date"
      variant="filled"
      InputLabelProps={{ shrink: true }}
      ref={ref}
      {...field}
      {...props}
      onChange={handleChange}
    />
  );

});
