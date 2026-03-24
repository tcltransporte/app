'use client';

import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLayout } from '@/context/LayoutContext';

function LayoutContent({ children, solicitationTypes, documentTypes, sitemapMenuItems }) {
  const { mobileOpen, toggleDrawer } = useLayout();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar 
        mobileOpen={mobileOpen} 
        onMobileClose={toggleDrawer} 
        initialSolicitationTypes={solicitationTypes}
        initialDocumentTypes={documentTypes}
        sitemapMenuItems={sitemapMenuItems}
      />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden', 
            backgroundColor: 'background.default' 
          }}
        >
          {children}
        </Box>
      </Box>
    </div>
  );
}

export default function MainLayout({ children, solicitationTypes, documentTypes, sitemapMenuItems }) {
  return (
    <LayoutContent solicitationTypes={solicitationTypes} documentTypes={documentTypes} sitemapMenuItems={sitemapMenuItems}>
      {children}
    </LayoutContent>
  );
}
