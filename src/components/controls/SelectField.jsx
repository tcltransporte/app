'use client';

import React from 'react';
import { TextField as MuiTextField, MenuItem } from '@mui/material';

/**
 * @param {Array<{ value, label }>} options - List of options to render
 */
export const SelectField = React.forwardRef(({ field, form, options = [], onChange, ...props }, ref) => {

  const handleChange = (e) => {
    field?.onChange(e);
    onChange?.(e.target.value);
  };

  return (
    <MuiTextField
      select
      variant="filled"
      SelectProps={{ native: true }}
      InputLabelProps={{ shrink: true }}
      fullWidth
      ref={ref}
      {...field}
      {...props}
      value={field?.value ?? props.value ?? ''}
      onChange={handleChange}
      sx={{
        '& select': {
          color: (field?.value ?? props.value ?? '') === '' ? 'text.secondary' : 'inherit'
        },
        ...props.sx
      }}
    >
      <option value="">[Selecione]</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </MuiTextField>
  );

});
