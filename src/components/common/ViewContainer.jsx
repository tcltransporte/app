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

  const getComponentType = (child) => {
    if (!isValidElement(child)) return null;
    const type = child.type;
    return type?.displayName || type?.name || type;
  };

  React.Children.forEach(children, (child) => {
    const typeIdentifier = getComponentType(child);
    
    if (typeIdentifier === Title || typeIdentifier === 'Title') {
      title = child;
    } else if (typeIdentifier === Footer || typeIdentifier === 'Footer') {
      footer = child;
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
