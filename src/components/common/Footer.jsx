'use client';

import React from 'react';
import { Box, Typography, Select, MenuItem, Pagination } from '@mui/material';
import { useLayout } from '@/context/LayoutContext';

export const Footer = ({ 
  count, // Number of pages
  page = 1, 
  rowsPerPage = 50, 
  total = 0,
  selectedCount = 0,
  onPageChange,
  onRowsPerPageChange 
}) => {
  const { isMobile } = useLayout();

  // Calculate pages if count is not provided
  const derivedCount = count ?? Math.max(1, Math.ceil(total / rowsPerPage));

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: { xs: 'center', sm: 'space-between' },
      alignItems: 'center',
      gap: { xs: 1.5, sm: 2 },
      py: 1.5,
      px: { xs: 2, md: 3 },
      backgroundColor: 'background.paper',
      borderTop: '1px solid',
      borderColor: 'divider',
      flexWrap: 'wrap'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: '100%', sm: 'auto' }
      }}>
        {selectedCount > 0 && (
          <Typography variant="body2" color="primary.main" fontWeight={600}>
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1, sm: 2 }, 
        flexWrap: 'wrap', 
        width: { xs: '100%', sm: 'auto' },
        justifyContent: 'center' 
      }}>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">Registros por página:</Typography>
        <Select
          value={rowsPerPage}
          size="small"
          variant="standard"
          onChange={onRowsPerPageChange}
          sx={{ fontSize: '0.75rem', '&:before, &:after': { display: 'none' } }}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
        1-{rowsPerPage} de {total}
      </Typography>
      <Pagination
        count={derivedCount}
        page={page}
        onChange={onPageChange}
        size={isMobile ? "small" : "medium"}
        shape="rounded"
        color="primary"
        sx={{
          '& .MuiPagination-ul': { gap: 0.5 },
        }}
        />
      </Box>
    </Box>
  );
};
