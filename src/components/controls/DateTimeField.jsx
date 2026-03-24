'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const DateTimeField = React.forwardRef(({ field, form, onChange, ...props }, ref) => {

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) {
      form?.setFieldValue(field.name, null);
    } else {
      const date = new Date(val + ':00Z');
      form?.setFieldValue(field.name, date);
    }
    onChange?.(e.target.value);
  };

  const value = formatDate(field.value);

  return (
    <MuiTextField
      type="datetime-local"
      variant="filled"
      size="small"
      InputLabelProps={{ shrink: true }}
      fullWidth
      ref={ref}
      {...field}
      {...props}
      value={value}
      onChange={handleChange}
    />
  );

});
