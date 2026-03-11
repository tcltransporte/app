'use client';

import React from 'react';
import { Box, Paper, Button, InputBase, IconButton, Fade, Slide } from '@mui/material';
import { keyframes } from '@mui/system';

const slideUp = keyframes`
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
`;
import { 
  Search as SearchIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';
import { PrimaryAction } from './PrimaryAction';
import { SecondaryActions } from './SecondaryActions';

export const Toolbar = ({ 
  primary,
  secondary,
}) => {
  const { isMobile } = useLayout();

  // Helper to render actions based on type (array or element)
  const renderPrimary = () => {
    if (!primary) return null;
    if (Array.isArray(primary)) return <PrimaryAction actions={primary} />;
    return primary;
  };

  const renderSecondary = () => {
    if (!secondary) return null;
    if (Array.isArray(secondary)) {
      return <SecondaryActions actions={secondary} />;
    }
    return secondary;
  };

  // If mobile, actions are floating
  if (isMobile) {
    return (
        <Box sx={{ 
          position: 'fixed',
          bottom: 32,
          right: 32,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 2,
          zIndex: 1050,
          width: 56,
          animation: `${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`
        }}>
          {renderPrimary()}
          {renderSecondary()}
        </Box>
    );
  }

  return (
      <Box
        sx={{
          py: 2,
          px: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          animation: `${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {renderPrimary()}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {renderSecondary()}
        </Box>
      </Box>
  );
};
