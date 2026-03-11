'use client';

import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Define the shape of our context
export const ThemeConfigContext = createContext({
  mode: 'light',
  skin: 'default',
  layout: 'vertical',
  menu: 'vertical', // vertical, recolhido, horizontal
  primaryColor: '#6366f1',
  semiDark: true,
  setMode: () => { },
  setSkin: () => { },
  setLayout: () => { },
  setMenu: () => { },
  setPrimaryColor: () => { },
  setSemiDark: () => { },
});

export const ThemeConfigProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [skin, setSkin] = useState('default');
  const [layout, setLayout] = useState('vertical');
  const [menu, setMenu] = useState('vertical');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [semiDark, setSemiDark] = useState(false);

  // Optional: load from localStorage if needed later.
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) setMode(savedMode);

    const savedColor = localStorage.getItem('theme-primaryColor');
    if (savedColor) setPrimaryColor(savedColor);

    const savedMenu = localStorage.getItem('theme-menu');
    if (savedMenu) setMenu(savedMenu);

    const savedSemiDark = localStorage.getItem('theme-semiDark');
    if (savedSemiDark) setSemiDark(savedSemiDark === 'true');
  }, []);

  const saveToStorage = (key, value) => {
    localStorage.setItem(`theme-${key}`, value);
  };

  const handleSetMode = (newMode) => {
    setMode(newMode);
    saveToStorage('mode', newMode);
  };

  const handleSetPrimaryColor = (newColor) => {
    setPrimaryColor(newColor);
    saveToStorage('primaryColor', newColor);
  };

  const handleSetMenu = (newMenu) => {
    setMenu(newMenu);
    saveToStorage('menu', newMenu);
  }

  const handleSetSemiDark = (val) => {
    setSemiDark(val);
    saveToStorage('semiDark', val);
  };

  // Create the MUI theme based on the current context state
  const theme = useMemo(() => createTheme({
    palette: {
      mode: mode === 'automatic' ? 'light' : mode, // Simplify automatic for now
      primary: {
        main: primaryColor,
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f8f9fa',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      }
    },
    shape: {
      borderRadius: skin === 'border' ? 0 : 8,
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: skin === 'border' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            boxShadow: skin === 'border' ? 'none' : '0px 2px 4px -1px rgba(0,0,0,0.05)',
            borderBottom: skin === 'border' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          }
        }
      }
    }
  }), [mode, primaryColor, skin]);

  const value = {
    mode, setMode: handleSetMode,
    skin, setSkin,
    layout, setLayout,
    menu, setMenu: handleSetMenu,
    primaryColor, setPrimaryColor: handleSetPrimaryColor,
    semiDark, setSemiDark: handleSetSemiDark
  };

  return (
    <ThemeConfigContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeConfigContext.Provider>
  );
};
