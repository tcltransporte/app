'use client';

import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

export const LoadingOverlay = ({ 
  open, 
  title = 'Processando...', 
  subtitle = 'Aguarde um momento' 
}) => {
  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 999,
        flexDirection: 'column',
        gap: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      open={open}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress color="primary" size={60} thickness={4} />
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};
