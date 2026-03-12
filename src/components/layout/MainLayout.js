'use client';

import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import SettingsDrawer from './SettingsDrawer';
import { LayoutProvider, useLayout } from '@/context/LayoutContext';

function LayoutContent({ children }) {
  const { mobileOpen, toggleDrawer, settingsOpen, toggleSettings } = useLayout();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={toggleDrawer} />

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

      <SettingsDrawer open={settingsOpen} onClose={toggleSettings} />
    </div>
  );
}

export default function MainLayout({ children }) {
  return (
    <LayoutProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </LayoutProvider>
  );
}
