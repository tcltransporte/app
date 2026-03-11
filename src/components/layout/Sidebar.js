'use client';

import React, { useContext, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Business,
  Verified,
  People,
  AccountBalance,
  Category,
  ReceiptLong,
  IntegrationInstructions,
  Group,
  Badge,
  MenuOpen,
  Map,
  Event,
  Info,
  Support,
  Build,
  Storefront,
  ExpandMore,
  ChevronRight
} from '@mui/icons-material';
import { ThemeConfigContext } from '@/components/ThemeConfigContext';
import { useRouter, usePathname } from 'next/navigation';

// Added subMenus based on the user's reference image
const menuItems = [
  {
    text: 'Início', icon: <Business />, subMenu: [
      { text: 'Índice', icon: <Map />, path: '/' },
      { text: 'Agenda', icon: <Event /> },
      { text: 'Integrações', icon: <IntegrationInstructions /> },
      { text: 'Sobre a versão', icon: <Info /> },
      { text: 'Ajuda do ERP', icon: <Support /> },
      { text: 'Ferramentas', icon: <Build /> },
      { text: 'Shopping de Serviços', icon: <Storefront /> },
    ]
  },
  { 
    text: 'Cadastros', icon: <Verified />, subMenu: [
      { text: 'Clientes', icon: <Group />, path: '/registers/partners' },
      { text: 'Fornecedores', icon: <Badge /> },
    ]
  },
  { text: 'Suprimentos', icon: <People /> },
  { text: 'Vendas', icon: <AccountBalance /> },
  { text: 'Finanças', icon: <Category /> },
  { text: 'Serviços', icon: <ReceiptLong /> },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const { menu, setMenu, primaryColor, mode, semiDark } = useContext(ThemeConfigContext);
  const [isHovered, setIsHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // Tracks which menu item's submenu is open

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Logic for Semi-Dark theme
  const isDarkMenu = mode === 'dark' || semiDark;
  const sidebarBg = isDarkMenu ? '#2b2c40' : '#ebebeb';
  const sidebarText = isDarkMenu ? 'rgba(255, 255, 255, 0.85)' : 'text.primary';
  const sidebarIcon = isDarkMenu ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
  const subMenuBg = isDarkMenu ? '#32344d' : '#ffffff';

  // Calculate effective drawer state: if mobile, always show full width.
  const isEffectivelyCollapsed = !isMobile && menu === 'recolhido' && !isHovered;
  const drawerWidth = isEffectivelyCollapsed ? 80 : 280;
  const subMenuWidth = 280;

  const commonTransition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  const handleMenuClick = (item) => {
    if (item.subMenu) {
      setActiveMenu(activeMenu === item.text ? null : item.text);
    } else {
      setActiveMenu(null);
    }
  };

  const handleSubItemClick = (subItem) => {
    if (subItem.path) {
      router.push(subItem.path);
      if (isMobile) onMobileClose();
    }
  };

  const activeItemData = menuItems.find(item => item.text === activeMenu);

  const renderSubMenuContent = (items) => (
    <List component="div" disablePadding>
      {items.map((subItem, index) => {
        const isActiveSub = subItem.path === pathname;
        return (
          <React.Fragment key={subItem.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleSubItemClick(subItem)}
                sx={{
                  borderRadius: 1,
                  minHeight: 40,
                  pl: isMobile ? 4 : 2, // indent on mobile
                  color: isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.7)' : 'text.primary'),
                  '& .MuiListItemIcon-root': {
                    color: isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary'),
                    minWidth: 40
                  },
                  '&:hover': {
                    backgroundColor: isDarkMenu ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ListItemIcon>
                  {React.cloneElement(subItem.icon, { sx: { fontSize: 20 } })}
                </ListItemIcon>
                <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            {subItem.text === 'Ferramentas' && !isMobile && (
              <Divider sx={{ my: 1, borderColor: isDarkMenu ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />
            )}
          </React.Fragment>
        );
      })}
    </List>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: sidebarText }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isEffectivelyCollapsed ? 'center' : 'space-between',
        p: 2,
        height: 64, // Matches Header height
      }}>
        {!isEffectivelyCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: `0 4px 8px ${primaryColor}44`
            }}>PP</Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: sidebarText }}>
              Paraíso Piscinas
            </Typography>
          </Box>
        )}
        {isEffectivelyCollapsed && (
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: `0 4px 12px ${primaryColor}66`
          }}>PP</Box>
        )}
      </Box>

      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {menuItems.map((item) => {
          const isSelected = activeMenu === item.text;

          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  selected={isSelected}
                  sx={{
                    minHeight: 46,
                    borderRadius: '12px',
                    justifyContent: isEffectivelyCollapsed ? 'center' : 'initial',
                    px: isEffectivelyCollapsed ? 0 : 2,
                    mx: isEffectivelyCollapsed ? 1 : 0,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'visible',
                    backgroundColor: 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: subMenuBg,
                      color: primaryColor,
                      boxShadow: isDarkMenu 
                        ? 'none' 
                        : (isMobile ? 'none' : '0 8px 16px -4px rgba(0,0,0,0.1)'),
                      zIndex: isMobile ? 1 : 2,
                      // The "pop out" and "connection" effect
                      ...(isSelected && !isMobile && {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        width: 'calc(100% + 16px)', // Extend to reach the drawer edge (List has px: 2)
                        mr: -2, // Pull to the right edge
                        backgroundColor: subMenuBg,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          right: -16, // Bridge the gap between main and sub drawer
                          top: 0,
                          width: 16,
                          height: '100%',
                          backgroundColor: subMenuBg,
                          zIndex: 3
                        }
                      }),
                      '& .MuiListItemText-root .MuiTypography-root': {
                        fontWeight: 700
                      },
                      '& .MuiListItemIcon-root': {
                        color: primaryColor
                      },
                      '&:hover': {
                        backgroundColor: subMenuBg,
                      }
                    },
                    '&:hover': {
                      backgroundColor: isDarkMenu ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)',
                      transform: isEffectivelyCollapsed ? 'scale(1.05)' : 'none'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isEffectivelyCollapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: isSelected ? primaryColor : sidebarIcon,
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                  </ListItemIcon>
                  {!isEffectivelyCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isSelected ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.8)' : 'inherit')
                      }}
                    />
                  )}

                  {!isEffectivelyCollapsed && item.subMenu && (
                    isMobile ? (
                      isSelected ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />
                    ) : (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.2)' : 'divider'),
                          ml: 1
                        }}
                      />
                    )
                  )}
                </ListItemButton>
              </ListItem>

              {/* Render mobile accordion submenu directly inline */}
              {isMobile && item.subMenu && isSelected && (
                <Box sx={{ mb: 2, ml: 1 }}>
                  {renderSubMenuContent(item.subMenu)}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  const subMenuContent = activeItemData && !isMobile && (
    <Box sx={{ width: subMenuWidth, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: subMenuBg, color: sidebarText }}>
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        borderBottom: '1px solid',
        borderColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color: primaryColor,
            textTransform: 'lowercase',
            letterSpacing: '0.02em'
          }}
        >
          {activeItemData.text}
        </Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {renderSubMenuContent(activeItemData.subMenu)}
      </Box>
    </Box>
  );

  const handleMouseLeaveNav = () => {
    setIsHovered(false);
    setActiveMenu(null); // When leaving the entire nav area, close any desktop submenus
  };

  return (
    <Box
      component="nav"
      sx={{ display: 'flex', flexShrink: 0, position: 'relative' }}
      onMouseLeave={handleMouseLeaveNav}
    >
      <Box sx={{ width: { lg: menu === 'recolhido' ? 80 : 280 }, transition: commonTransition }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 280,
              backgroundColor: sidebarBg,
              color: sidebarText,
              borderRight: 'none'
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth, 
              transition: commonTransition,
              overflowX: 'visible', // Allows the selected item to pop out
              borderRight: 'none', // Remove the dividing line to create a seamless connection
              backgroundColor: sidebarBg,
              boxShadow: (isDarkMenu && !activeMenu) ? '4px 0 10px rgba(0,0,0,0.1)' : 'none',
              overflow: 'hidden' // Root paper should not scroll, internal elements should
            },
          }}
          open
          onMouseEnter={() => setIsHovered(true)}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Sub Menu Overlay Drawer (Desktop Only) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            pointerEvents: activeMenu ? 'auto' : 'none',
            zIndex: theme.zIndex.drawer - 1,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: subMenuWidth,
              left: drawerWidth, 
              transition: commonTransition,
              transform: activeMenu ? 'translateX(0)' : 'translateX(-100%)', // Slide out from behind
              visibility: activeMenu ? 'visible' : 'hidden',
              boxShadow: activeMenu ? '4px 0px 8px rgba(0,0,0,0.05)' : 'none',
              border: 'none',
              backgroundColor: subMenuBg,
              overflow: 'hidden'
            },
          }}
          open={Boolean(activeMenu)}
        >
          {subMenuContent}
        </Drawer>
      )}
    </Box>
  );
}
