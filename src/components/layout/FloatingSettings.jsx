'use client';

import React, { useState, useEffect } from 'react';
import { Fab } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';
import SettingsDrawer from './SettingsDrawer';

export default function FloatingSettings() {
  const { settingsOpen, toggleSettings } = useLayout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <SettingsDrawer open={settingsOpen} onClose={toggleSettings} />
      
      {!settingsOpen && (
        <Fab 
          color="primary" 
          onClick={toggleSettings}
          size="small"
          sx={{
            position: 'fixed',
            right: -20,
            top: 180,
            width: 40,
            height: 40,
            minHeight: 40,
            borderRadius: '12px 0 0 12px',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            paddingRight: '12px',
            '&:hover': {
              right: 0,
              paddingRight: 0
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem'
            }
          }}
        >
          <SettingsIcon />
        </Fab>
      )}
    </>
  );
}
