'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const DateField = React.forwardRef(({ field, form, onChange, ...props }, ref) => {

  const formatDate = (date) => {
    if (!date) return '';
    
    // Prioritize literal string matching if it's a YYYY-MM-DD format
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 10);
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    // CENTER THE DATE: Add 12 hours to avoid timezone serialization shifts 
    // that might push the time to 23:00 of the previous day or 03:00 of the same day.
    const safeDate = new Date(d.getTime() + (12 * 3600000));
    const pad = (n) => String(n).padStart(2, '0');
    return `${safeDate.getUTCFullYear()}-${pad(safeDate.getUTCMonth() + 1)}-${pad(safeDate.getUTCDate())}`;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) {
      form?.setFieldValue(field.name, null);
    } else {
      // Create a Date object at 00:00 local time for this date
      const date = new Date(val + 'T00:00:00');
      form?.setFieldValue(field.name, date);
    }
    onChange?.(e.target.value);
  };

  const value = formatDate(field.value);

  return (
    <MuiTextField
      type="date"
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
