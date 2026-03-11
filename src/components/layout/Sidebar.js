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

// Added subMenus based on the user's reference image
const menuItems = [
  {
    text: 'Início', icon: <Business />, subMenu: [
      { text: 'Índice', icon: <Map /> },
      { text: 'Agenda', icon: <Event /> },
      { text: 'Integrações', icon: <IntegrationInstructions /> },
      { text: 'Sobre a versão', icon: <Info /> },
      { text: 'Ajuda do ERP', icon: <Support /> },
      { text: 'Ferramentas', icon: <Build /> },
      { text: 'Shopping de Serviços', icon: <Storefront /> },
    ]
  },
  { text: 'Cadastros', icon: <Verified /> },
  { text: 'Suprimentos', icon: <People /> },
  { text: 'Vendas', icon: <AccountBalance /> },
  { text: 'Finanças', icon: <Category /> },
  { text: 'Serviços', icon: <ReceiptLong /> },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { menu, setMenu, primaryColor } = useContext(ThemeConfigContext);
  const [isHovered, setIsHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // Tracks which menu item's submenu is open

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Calculate effective drawer state: if mobile, always show full width.
  const isEffectivelyCollapsed = !isMobile && menu === 'recolhido' && !isHovered;
  const drawerWidth = isEffectivelyCollapsed ? 80 : 260;
  const subMenuWidth = 260;

  const handleToggleCollapse = () => {
    setMenu(menu === 'recolhido' ? 'vertical' : 'recolhido');
  };

  const handleMenuClick = (item) => {
    if (item.subMenu) {
      setActiveMenu(activeMenu === item.text ? null : item.text);
    } else {
      setActiveMenu(null);
    }
  };

  const activeItemData = menuItems.find(item => item.text === activeMenu);

  const renderSubMenuContent = (items) => (
    <List component="div" disablePadding>
      {items.map((subItem, index) => (
        <React.Fragment key={subItem.text}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={{
                borderRadius: 1,
                minHeight: 40,
                pl: isMobile ? 4 : 2, // indent on mobile
                color: index === 0 ? primaryColor : 'text.primary',
                '& .MuiListItemIcon-root': {
                  color: index === 0 ? primaryColor : 'text.secondary',
                  minWidth: 40
                }
              }}
            >
              <ListItemIcon>
                {subItem.icon}
              </ListItemIcon>
              <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
          {subItem.text === 'Ferramentas' && !isMobile && <Divider sx={{ my: 1 }} />}
        </React.Fragment>
      ))}
    </List>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isEffectivelyCollapsed ? 'center' : 'space-between',
        p: 2,
        height: 64, // Matches Header height
      }}>
        {!isEffectivelyCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>PP</Box>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>Paraíso Piscinas</Typography>
          </Box>
        )}
        {isEffectivelyCollapsed && (
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>PP</Box>
        )}
      </Box>

      <List sx={{ flexGrow: 1, px: 0, pt: 2 }}>
        {menuItems.map((item) => {
          const isSelected = activeMenu === item.text;

          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  selected={isSelected}
                  sx={{
                    minHeight: 44,
                    borderTopLeftRadius: isSelected && !isMobile ? 30 : 1,
                    borderBottomLeftRadius: isSelected && !isMobile ? 30 : 1,
                    borderTopRightRadius: isSelected && isMobile ? 1 : 0,
                    borderBottomRightRadius: isSelected && isMobile ? 1 : 0,
                    justifyContent: isEffectivelyCollapsed ? 'center' : 'initial',
                    px: 2.5,
                    ml: isSelected && !isMobile ? 2 : 0, // indent only on desktop
                    mr: 0,
                    transition: 'none', // prevent flashing content text on rapid hover
                    backgroundColor: isSelected && !isMobile ? 'background.paper' : 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: isMobile ? 'rgba(0,0,0,0.04)' : 'background.paper',
                      color: primaryColor,
                      boxShadow: isMobile ? 'none' : '-4px 4px 10px rgba(0,0,0,0.05), 0px -4px 10px rgba(0,0,0,0.05)',
                      zIndex: isMobile ? 1 : 2,
                      position: 'relative',
                      '& .MuiListItemText-root .MuiTypography-root': {
                        fontWeight: 'bold'
                      },
                      '& .MuiListItemIcon-root': {
                        color: primaryColor
                      },
                      '&:hover': {
                        backgroundColor: isMobile ? 'rgba(0,0,0,0.08)' : 'background.paper',
                      }
                    },
                    '&:hover': {
                      backgroundColor: isSelected && !isMobile ? 'background.paper' : 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isEffectivelyCollapsed ? 0 : 2,
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isEffectivelyCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isSelected ? 'bold' : 'bold',
                        color: isSelected ? primaryColor : 'text.primary'
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
                          backgroundColor: isSelected ? primaryColor : 'divider',
                          ml: 1
                        }}
                      />
                    )
                  )}
                </ListItemButton>
              </ListItem>

              {/* Render mobile accordion submenu directly inline */}
              {isMobile && item.subMenu && isSelected && (
                <Box sx={{ mb: 1 }}>
                  {renderSubMenuContent(item.subMenu)}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </List>

      {/* Collapse Button at the bottom */}
      <Box sx={{ p: 2, display: { xs: 'none', lg: 'block' }, borderTop: '1px solid', borderColor: 'rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isEffectivelyCollapsed ? 'center' : 'space-between' }}>
          {!isEffectivelyCollapsed && <Typography variant="caption" sx={{ ml: 1 }}>Expandir menu</Typography>}
          <IconButton onClick={handleToggleCollapse} sx={{ borderRadius: 1 }}>
            <MenuOpen sx={{ transform: menu === 'recolhido' ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  const subMenuContent = activeItemData && !isMobile && (
    <Box sx={{ width: subMenuWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'rgba(0,0,0,0.05)'
      }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color: primaryColor,
            textTransform: 'lowercase' // Based on user screenshot style
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
      sx={{ display: 'flex', flexShrink: 0 }}
      onMouseLeave={handleMouseLeaveNav}
    >
      <Box sx={{ width: { lg: menu === 'recolhido' ? 80 : 260 }, transition: 'width 0.3s' }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
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
              width: drawerWidth, // Will be 80 or 260 based on isEffectivelyCollapsed
              transition: 'width 0.3s',
              overflowX: 'visible', // Allows the selected item to pop out
              borderRight: 'none', // Remove the dividing line to create a seamless connection
              backgroundColor: '#ebebeb',
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
            display: { xs: 'none', lg: activeMenu ? 'block' : 'none' },
            pointerEvents: activeMenu ? 'auto' : 'none', // important for allowing hover out mapping when closing
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: subMenuWidth,
              left: drawerWidth, // Position it right next to the current width configuration of the main drawer
              transition: 'left 0.3s, opacity 0.3s, transform 0.3s',
              transform: activeMenu ? 'translateX(0)' : 'translateX(-100%)', // slide in effect
              boxShadow: activeMenu ? '4px 0px 8px rgba(0,0,0,0.05)' : 'none',
              border: 'none', // Remove divider
              zIndex: theme.zIndex.drawer - 1 // behind the main drawer so the selected active item shadows cast properly
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
