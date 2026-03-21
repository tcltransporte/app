import React from 'react';
import { Box, Typography } from '@mui/material';

export const PlaceholderTab = ({ title }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" color="text.secondary">
      Componente de {title} em desenvolvimento
    </Typography>
  </Box>
);
