'use client';

import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LayoutProvider } from '@/context/LayoutContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { LoadingProvider } from '@/context/LoadingContext';
import FloatingSettings from '@/components/layout/FloatingSettings';

// Define the shape of our context
export const ThemeContext = createContext({
  mode: 'light',
  skin: 'default',
  layout: 'vertical',
  menu: 'recolhido',
  primaryColor: '#6366f1',
  semiDark: true,
  zoom: 0.9,
  initialMobile: false,
  setMode: () => { },
  setSkin: () => { },
  setLayout: () => { },
  setMenu: () => { },
  setPrimaryColor: () => { },
  setSemiDark: () => { },
  setZoom: () => { },
});

export const ThemeContextProvider = ({ children, initialConfig = {}, initialMobile = false }) => {
  const [mode, setMode] = useState(initialConfig.mode || 'light');
  const [skin, setSkin] = useState('default');
  const [layout, setLayout] = useState('vertical');
  const [menu, setMenu] = useState(initialConfig.menu || 'recolhido');
  const [primaryColor, setPrimaryColor] = useState(initialConfig.primaryColor || '#6366f1');
  const [semiDark, setSemiDark] = useState(initialConfig.semiDark || false);
  const [zoom, setZoom] = useState(initialConfig.zoom || 0.9);


  const saveToStorage = (key, value) => {
    localStorage.setItem(`theme-${key}`, value);
    document.cookie = `theme-${key}=${value}; path=/; max-age=31536000`; // 1 year
  };

  // Sync existing localStorage preferences to cookies if missing in cookies
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode && document.cookie.indexOf('theme-mode=') === -1) {
      setMode(savedMode);
      saveToStorage('mode', savedMode);
    }

    const savedColor = localStorage.getItem('theme-primaryColor');
    if (savedColor && document.cookie.indexOf('theme-primaryColor=') === -1) {
      setPrimaryColor(savedColor);
      saveToStorage('primaryColor', savedColor);
    }

    const savedMenu = localStorage.getItem('theme-menu');
    if (savedMenu && document.cookie.indexOf('theme-menu=') === -1) {
      setMenu(savedMenu);
      saveToStorage('menu', savedMenu);
    }

    const savedSemiDark = localStorage.getItem('theme-semiDark');
    if (savedSemiDark && document.cookie.indexOf('theme-semiDark=') === -1) {
      setSemiDark(savedSemiDark === 'true');
      saveToStorage('semiDark', savedSemiDark);
    }

    const savedZoom = localStorage.getItem('theme-zoom');
    if (savedZoom && document.cookie.indexOf('theme-zoom=') === -1) {
      const parsedZoom = Number(savedZoom);
      if (!Number.isNaN(parsedZoom) && parsedZoom > 0) {
        setZoom(parsedZoom);
        saveToStorage('zoom', parsedZoom);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.setProperty('--app-zoom', String(zoom));
    document.body.style.zoom = String(zoom);
  }, [zoom]);

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

  const handleSetZoom = (val) => {
    const parsedZoom = Number(val);
    if (Number.isNaN(parsedZoom) || parsedZoom <= 0) return;
    setZoom(parsedZoom);
    saveToStorage('zoom', parsedZoom);
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
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'dark' ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.1) transparent',
            '&::-webkit-scrollbar': {
              width: '5px',
              height: '5px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
            },
          },
        },
      },
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
    semiDark, setSemiDark: handleSetSemiDark,
    zoom, setZoom: handleSetZoom,
    initialMobile,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <LayoutProvider>
            <LoadingProvider>
              <CssBaseline />
              {children}
              <FloatingSettings />
            </LoadingProvider>
          </LayoutProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
