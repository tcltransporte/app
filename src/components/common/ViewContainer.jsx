'use client';

import React, { isValidElement } from 'react';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';
import { Title } from '@/components/common/Title';
import { Footer } from '@/components/common/Footer';

export const ViewContainer = ({ children }) => {
  let title = null;
  let footer = null;
  const content = [];

  React.Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      if (child.type === Title || child.type?.name === 'Title' || child.type?.displayName === 'Title') {
        title = child;
      } else if (child.type === Footer || child.type?.name === 'Footer' || child.type?.displayName === 'Footer') {
        footer = child;
      } else {
        content.push(child);
      }
    } else {
      content.push(child);
    }
  });
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
        {content}
      </Box>

      {footer && (
        <Box sx={{ mt: 'auto' }}>
          {footer}
        </Box>
      )}
    </Box>
  );
};
