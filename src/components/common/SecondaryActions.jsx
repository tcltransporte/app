'use client';

import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, Box, Button } from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';
import { SplitButton } from './SplitButton';

export const SecondaryActions = ({ actions = [], icon = <MoreIcon /> }) => {
  const { isMobile, theme } = useLayout();
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!isMobile) {
    return (
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {actions.map((action, index) => {
          if (React.isValidElement(action)) return React.cloneElement(action, { key: `custom-action-${index}` });
          
          if (action.options && action.options.length > 0) {
            return (
              <SplitButton
                key={action.label}
                label={action.label}
                icon={action.icon}
                variant={action.variant || "outlined"}
                color={action.color || "primary"}
                onClick={action.onClick}
                options={action.options}
                sx={{ ml: 0 }}
              />
            );
          }

          return (
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
          );
        })}
      </Box>
    );
  }

  // Mobile: Flatten actions including sub-options
  const flatActions = actions.reduce((acc, action) => {
    if (React.isValidElement(action)) return [...acc, action];
    
    const mainAction = { ...action };
    delete mainAction.options; // Don't pass options to SpeedDialAction
    
    acc.push(mainAction);
    
    if (action.options) {
      acc.push(...action.options);
    }
    
    return acc;
  }, []);

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
      {flatActions.map((action, index) => {
        if (React.isValidElement(action)) return React.cloneElement(action, { key: `custom-speeddial-${index}` });
        return (
          <SpeedDialAction
            key={`${action.label}-${index}`}
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
        );
      })}
    </SpeedDial>
  );
};
