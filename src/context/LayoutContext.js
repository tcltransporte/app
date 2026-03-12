import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { ThemeContext } from './ThemeContext';

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
  const { initialMobile } = useContext(ThemeContext);
  const [isMobile, setIsMobile] = useState(initialMobile);
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      // Use the 'md' value (900px) from MUI theme
      setIsMobile(window.innerWidth < theme.breakpoints.values.md);
    };

    // Run on mount
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [theme]);


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
