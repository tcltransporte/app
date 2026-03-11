'use client';

import React, { useContext } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  LightMode,
  DarkMode,
  SettingsBrightness,
  Palette,
  Dashboard,
  ViewSidebar,
  TableRows
} from '@mui/icons-material';
import { ThemeConfigContext } from '@/components/ThemeConfigContext';

const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#64748b'];

export default function SettingsDrawer({ open, onClose }) {
  const {
    mode, setMode,
    skin, setSkin,
    layout, setLayout,
    menu, setMenu,
    primaryColor, setPrimaryColor,
    semiDark, setSemiDark
  } = useContext(ThemeConfigContext);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Customização</Typography>
          <Typography variant="body2" color="text.secondary">
            Personalize e visualize em tempo real
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <Divider />

      <Box sx={{ p: 2 }}>
        {/* Colors */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Cor</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {colors.map((color) => (
            <IconButton
              key={color}
              onClick={() => setPrimaryColor(color)}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: color,
                color: 'white',
                border: primaryColor === color ? '2px solid' : '2px solid transparent',
                borderColor: primaryColor === color ? 'text.primary' : 'transparent',
                '&:hover': { backgroundColor: color, opacity: 0.8 }
              }}
            >
              {primaryColor === color && <Palette fontSize="small" />}
            </IconButton>
          ))}
          
          {/* Custom Color Picker Button */}
          <Box sx={{ position: 'relative', width: 38, height: 38 }}>
            <Tooltip title="Paleta de Cores">
              <IconButton
                onClick={() => document.getElementById('custom-color-picker').click()}
                sx={{
                  width: 38,
                  height: 38,
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: 'white',
                  border: !colors.includes(primaryColor) ? '2px solid' : '2px solid transparent',
                  borderColor: !colors.includes(primaryColor) ? 'text.primary' : 'transparent',
                }}
              >
                <Palette fontSize="small" />
              </IconButton>
            </Tooltip>
            <input 
              id="custom-color-picker"
              type="color" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 0,
                height: 0,
                padding: 0,
                border: 'none',
                opacity: 0,
                pointerEvents: 'none'
              }}
            />
          </Box>
        </Box>

        {/* Mode */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Modo</Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => newMode && setMode(newMode)}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="light">
            <LightMode sx={{ mr: 1, fontSize: 18 }} /> Claro
          </ToggleButton>
          <ToggleButton value="dark">
            <DarkMode sx={{ mr: 1, fontSize: 18 }} /> Escuro
          </ToggleButton>
          <ToggleButton value="automatic">
            <SettingsBrightness sx={{ mr: 1, fontSize: 18 }} /> Automático
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Skin */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Skin</Typography>
        <RadioGroup
          row
          value={skin}
          onChange={(e) => setSkin(e.target.value)}
          sx={{ mb: 3 }}
        >
          <FormControlLabel
            value="default"
            control={<Radio />}
            label="Default"
          />
          <FormControlLabel
            value="border"
            control={<Radio />}
            label="Bordas"
          />
        </RadioGroup>

        <FormControlLabel
          control={<Switch checked={semiDark} onChange={(e) => setSemiDark(e.target.checked)} />}
          label="Semi Escuro"
          sx={{ mb: 3, width: '100%' }}
        />

        <Divider sx={{ mb: 3 }} />

        {/* Layout */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Layout</Typography>
        <RadioGroup
          row
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          sx={{ mb: 3, display: 'none' }} // Hidden structurally if not implemented, keeping state for future
        >
          <FormControlLabel value="vertical" control={<Radio />} label="Vertical" />
          <FormControlLabel value="horizontal" control={<Radio />} label="Horizontal" />
        </RadioGroup>

        {/* Menu */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Menu</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Vertical Menu">
            <IconButton
              color={menu === 'vertical' ? 'primary' : 'default'}
              onClick={() => setMenu('vertical')}
              sx={{ border: '1px solid', borderColor: menu === 'vertical' ? 'primary.main' : 'divider', borderRadius: 2, p: 2 }}
            >
              <Dashboard />
            </IconButton>
          </Tooltip>
          <Tooltip title="Menu Recolhido">
            <IconButton
              color={menu === 'recolhido' ? 'primary' : 'default'}
              onClick={() => setMenu('recolhido')}
              sx={{ border: '1px solid', borderColor: menu === 'recolhido' ? 'primary.main' : 'divider', borderRadius: 2, p: 2 }}
            >
              <ViewSidebar />
            </IconButton>
          </Tooltip>
          <Tooltip title="Menu Horizontal">
            <IconButton
              color={menu === 'horizontal' ? 'primary' : 'default'}
              onClick={() => setMenu('horizontal')}
              sx={{ border: '1px solid', borderColor: menu === 'horizontal' ? 'primary.main' : 'divider', borderRadius: 2, p: 2 }}
            >
              <TableRows />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
}
