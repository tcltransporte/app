'use client';

import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Breadcrumbs, Link, Avatar, Menu, MenuItem, ListItemIcon, Divider, Badge } from '@mui/material';
import { Menu as MenuIcon, Settings as SettingsIcon, Logout, Person, Settings } from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';
import { ThemeContext } from "@/context/ThemeContext";
import { SessionContext } from '@/context/SessionContext';
import { useContext, useState } from 'react';
import * as loginService from "@/app/services/login.service";
import { useRouter } from "next/navigation";

export default function Header({ children }) {
  const { toggleDrawer, toggleSettings } = useLayout();
  const { primaryColor } = useContext(ThemeContext);
  const { session } = useContext(SessionContext);
  const router = useRouter();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    handleClose();
    try {
      await loginService.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const name = session?.user?.userName || '';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

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
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>
                {session?.user?.userName?.toLowerCase() || 'usuário'}
              </Typography>
              <Typography variant="caption" color="text.secondary">/</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', textTransform: 'uppercase' }}>
                {session?.company ? `${session.company.companyBusiness?.name || ''} - ${session.company.surname || ''}` : ''}
              </Typography>
              
              <IconButton 
                onClick={handleClick}
                size="small"
                sx={{ ml: 0.5, p: 0.5 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#44b700',
                      color: '#44b700',
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                      '&::after': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        animation: 'ripple 1.2s infinite ease-in-out',
                        border: '1px solid currentColor',
                        content: '""',
                      },
                    },
                    '@keyframes ripple': {
                      '0%': { transform: 'scale(.8)', opacity: 1 },
                      '100%': { transform: 'scale(2.4)', opacity: 0 },
                    },
                  }}
                >
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: primaryColor,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {initials || <Person />}
                  </Avatar>
                </Badge>
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                    mt: 1.5,
                    minWidth: 180,
                    borderRadius: 2,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => router.push('/settings')}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                Ajustes
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Box>
      </Toolbar>
    </AppBar>
  );
}
