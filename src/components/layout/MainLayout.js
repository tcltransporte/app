'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import SettingsDrawer from './SettingsDrawer';
import { ThemeConfigProvider } from '@/components/ThemeConfigContext';

function LayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%vw' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          onToggleDrawer={handleDrawerToggle}
          onToggleSettings={handleSettingsToggle}
        />

        <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto', backgroundColor: 'background.default' }}>
          {children}
        </Box>
      </Box>

      <SettingsDrawer open={settingsOpen} onClose={handleSettingsToggle} />
    </Box>
  );
}

export default function MainLayout({ children }) {
  return (
    <ThemeConfigProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </ThemeConfigProvider>
  );
}
