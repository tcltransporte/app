'use client';

import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';
import { FilterDrawer } from '@/components/common';

export default function DistributionFilter({ open, filters, onClose, onApply }) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (field) => (event) => {
    setLocalFilters({ ...localFilters, [field]: event.target.value });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    const cleared = { nsu: '', idSchema: '', isUnPack: '' };
    setLocalFilters(cleared);
    onApply(cleared);
  };

  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      onApply={handleApply}
      onClear={handleClear}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
        <TextField
          label="NSU"
          value={localFilters.nsu || ''}
          onChange={handleChange('nsu')}
          fullWidth
          size="small"
        />
        <TextField
          label="ID Schema"
          value={localFilters.idSchema || ''}
          onChange={handleChange('idSchema')}
          fullWidth
          size="small"
        />
        <TextField
          select
          label="Descompactado"
          value={localFilters.isUnPack || ''}
          onChange={handleChange('isUnPack')}
          fullWidth
          size="small"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="true">Sim</MenuItem>
          <MenuItem value="false">Não</MenuItem>
        </TextField>
      </Box>
    </FilterDrawer>
  );
}
