'use client';

import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Menu as MenuIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';

export default function Header({ children }) {
  const { toggleDrawer, toggleSettings } = useLayout();

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      backgroundColor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}>
      <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
          }}>
            {children}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, gap: 1 }}>
              <Link underline="hover" color="inherit" href="/">
                guilherme.venancio
              </Link>
              <Typography variant="caption" color="text.secondary">/</Typography>
              <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                PARAISO PISCINAS - MATR...
              </Typography>
            </Box>
            
            <IconButton color="primary" onClick={toggleSettings}>
              <SettingsIcon />
            </IconButton>
          </Box>
      </Toolbar>
    </AppBar>
  );
}
