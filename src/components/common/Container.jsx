'use client';

import React, { isValidElement } from 'react';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';
import { Title } from '@/components/common/Title';
import { Footer } from '@/components/common/Footer';

const ContainerTitle = (props) => (
  <Header>
    <Title {...props} />
  </Header>
);

const ContainerContent = ({ children }) => (
  <Box sx={{
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    p: { xs: 2, md: 3 },
    overflow: 'hidden',
    backgroundColor: 'background.default',
    gap: 2
  }}>
    {children}
  </Box>
);

const ContainerFooter = (props) => (
  <Box sx={{ mt: 'auto' }}>
    <Footer {...props} />
  </Box>
);

export const Container = ({ children }) => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </Box>
  );
};

Container.Title = ContainerTitle;
Container.Footer = ContainerFooter;
Container.Content = ContainerContent;



