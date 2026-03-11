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
  const isMobileMediaQuery = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = mounted ? isMobileMediaQuery : false;

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
