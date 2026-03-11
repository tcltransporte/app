'use client';

import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import SettingsDrawer from './SettingsDrawer';
import { ThemeConfigProvider } from '@/components/ThemeConfigContext';
import { LayoutProvider, useLayout } from '@/context/LayoutContext';

function LayoutContent({ children }) {
  const { mobileOpen, toggleDrawer, settingsOpen, toggleSettings } = useLayout();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
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
    </Box>
  );
}

export default function MainLayout({ children }) {
  return (
    <ThemeConfigProvider>
      <LayoutProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </LayoutProvider>
    </ThemeConfigProvider>
  );
}
