'use client';

import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Menu as MenuIcon, Settings as SettingsIcon } from '@mui/icons-material';

export default function Header({ onToggleDrawer, onToggleSettings }) {
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
          onClick={onToggleDrawer}
          sx={{ mr: 2, display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', mr: 3 }}>
            Configurações
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Breadcrumbs aria-label="breadcrumb" sx={{ display: { xs: 'none', md: 'block' }, mr: 3 }}>
            <Link underline="hover" color="inherit" href="/">
              guilherme.venancio
            </Link>
            <Typography color="text.primary">PARAISO PISCINAS - MATR...</Typography>
          </Breadcrumbs>
          
          <IconButton color="primary" onClick={onToggleSettings}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
