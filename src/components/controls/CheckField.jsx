'use client';

import React from 'react';
import { Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material';

export const CheckField = React.forwardRef(({ field, form, label, onChange, ...props }, ref) => {

  const handleChange = (e) => {
    const checked = e.target.checked;

    // Formik integration
    field?.onChange(e);

    onChange?.(checked);
  };

  return (
    <FormControlLabel
      label={label}
      control={
        <MuiCheckbox
          ref={ref}
          {...field}
          {...props}
          checked={field?.value ?? props.checked ?? false}
          onChange={handleChange}
        />
      }
    />
  );
});
