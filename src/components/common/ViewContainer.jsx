'use client';

import React from 'react';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';

export const ViewContainer = ({ children, title, footer }) => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header>
        {title}
      </Header>

      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, md: 3 },
        pb: footer ? 0 : { xs: 2, md: 3 }, // No bottom padding if footer exists
        overflow: 'hidden',
        backgroundColor: 'background.default',
        gap: 2
      }}>
        {children}
      </Box>

      {footer && (
        <Box sx={{ mt: 'auto' }}>
          {footer}
        </Box>
      )}
    </Box>
  );
};
