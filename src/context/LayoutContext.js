import React, { createContext, useContext, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

const LayoutContext = createContext({
  mobileOpen: false,
  settingsOpen: false,
  isMobile: false,
  theme: null,
  toggleDrawer: () => {},
  toggleSettings: () => {},
});

export const LayoutProvider = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleDrawer = () => setMobileOpen((prev) => !prev);
  const toggleSettings = () => setSettingsOpen((prev) => !prev);

  return (
    <LayoutContext.Provider value={{ 
      mobileOpen, 
      settingsOpen, 
      isMobile, 
      theme, 
      toggleDrawer, 
      toggleSettings 
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
