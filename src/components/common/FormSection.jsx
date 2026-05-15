'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Seção com barra de título alinhada à cor primária do tema.
 */
export function FormSection({ title, children, actions, sx }) {
  return (
    <Box sx={sx}>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 0.75,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4
        }}
      >
        <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {title}
        </Typography>
        {actions}
      </Box>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderTop: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          p: 1.5,
          bgcolor: 'background.paper'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
