import React from 'react';
import { Button, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, Box } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useLayout } from '@/context/LayoutContext';

export const PrimaryAction = ({ 
  actions = [],
  label, // Fallback for single action
  icon = <AddIcon />, // Fallback for single action
  onClick, // Fallback for single action
  ...props 
}) => {
  const { isMobile, theme } = useLayout();
  const [open, setOpen] = React.useState(false);

  // Normalize actions
  const normalizedActions = actions.length > 0 
    ? actions 
    : [{ label: label || "Adicionar", icon, onClick }];

  const mainAction = normalizedActions[0];
  const subActions = normalizedActions.slice(1);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {normalizedActions.map((action, index) => (
          <Fab
            key={action.label}
            color={index === 0 ? "primary" : "default"}
            size={index === 0 ? "large" : "medium"}
            onClick={action.onClick}
            sx={{
              boxShadow: theme?.shadows[index === 0 ? 8 : 4],
              backgroundColor: index === 0 ? 'primary.main' : 'background.paper',
              color: index === 0 ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: index === 0 ? 'primary.dark' : 'background.default',
              }
            }}
          >
            {action.icon}
          </Fab>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {normalizedActions.map((action, index) => (
        <Button
          key={action.label}
          variant={action.variant || (index === 0 ? "contained" : "outlined")}
          color={action.color || "primary"}
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            px: index === 0 ? 3 : 2,
            ...(index === 0 && {
              boxShadow: `0 4px 12px ${theme?.palette.primary.main}44`,
            }),
            ...props.sx
          }}
          {...props}
        >
          {action.label}
        </Button>
      ))}
    </Box>
  );
};
