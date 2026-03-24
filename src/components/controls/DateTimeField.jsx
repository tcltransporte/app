'use client';

import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

export const DateTimeField = React.forwardRef(({ field, form, onChange, ...props }, ref) => {

  const formatDate = (date) => {
    if (!date) return '';
    
    // Prioritize direct string matching to bypass constructor shifts
    if (typeof date === 'string') {
      const match = date.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
      if (match) return `${match[1]}T${match[2]}`;
      
      const dateOnlyMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateOnlyMatch) return `${dateOnlyMatch[1]}T00:00`;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    // For Date objects, use UTC as fallback to match most common ISO serialization
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) {
      form?.setFieldValue(field.name, null);
    } else {
      // Create local Date to match what the user typed exactly
      const date = new Date(val + ':00');
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
