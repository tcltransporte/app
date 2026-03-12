'use client';

import React, { isValidElement } from 'react';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';
import { Title } from '@/components/common/Title';
import { Footer } from '@/components/common/Footer';

const ContainerTitle = (props) => <Title {...props} />;
const ContainerFooter = (props) => <Footer {...props} />;
const ContainerContent = ({ children }) => <>{children}</>;

export const Container = ({ children }) => {
  let title = null;
  let footer = null;
  let mainContent = null;
  const otherContent = [];

  React.Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      otherContent.push(child);
      return;
    }

    if (child.type === ContainerTitle) {
      title = child;
    } else if (child.type === ContainerFooter) {
      footer = child;
    } else if (child.type === ContainerContent) {
      mainContent = child.props.children;
    } else {
      otherContent.push(child);
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
        pb: footer ? 0 : { xs: 2, md: 3 },
        overflow: 'hidden',
        backgroundColor: 'background.default',
        gap: 2
      }}>
        {mainContent || otherContent}
      </Box>

      {footer && (
        <Box sx={{ mt: 'auto' }}>
          {footer}
        </Box>
      )}
    </Box>
  );
};

Container.Title = ContainerTitle;
Container.Footer = ContainerFooter;
Container.Content = ContainerContent;



