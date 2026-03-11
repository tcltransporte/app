'use client';

import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, Box, Button } from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';

export const SecondaryActions = ({ actions = [], icon = <MoreIcon /> }) => {
  const { isMobile, theme } = useLayout();
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!isMobile) {
    return (
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant || "text"}
            color={action.color || "inherit"}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{ 
              textTransform: 'none', 
              color: action.color ? undefined : 'text.secondary', 
              fontWeight: 500,
              fontSize: '0.875rem',
              borderRadius: '8px',
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    );
  }

  return (
    <SpeedDial
      ariaLabel="Ações secundárias"
      sx={{ 
        zIndex: 1050,
        '& .MuiFab-primary': {
          backgroundColor: 'background.paper',
          color: 'text.secondary',
          boxShadow: theme?.shadows[4],
          '&:hover': {
            backgroundColor: 'background.default',
          }
        }
      }}
      FabProps={{ size: 'medium' }}
      icon={<SpeedDialIcon icon={icon} openIcon={<CloseIcon />} />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.label}
          icon={action.icon}
          tooltipTitle={action.label}
          tooltipOpen
          onClick={() => {
            if (action.onClick) action.onClick();
            handleClose();
          }}
          sx={{
            whiteSpace: 'nowrap',
            '& .MuiSpeedDialAction-staticTooltipLabel': {
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'text.primary',
              backgroundColor: 'background.paper',
              boxShadow: theme?.shadows[2],
            }
          }}
        />
      ))}
    </SpeedDial>
  );
};
