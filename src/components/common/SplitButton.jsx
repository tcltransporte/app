'use client';

import React from 'react';
import { 
  Button, 
  ButtonGroup, 
  ClickAwayListener, 
  Grow, 
  Paper, 
  Popper, 
  MenuItem, 
  MenuList,
  Box
} from '@mui/material';
import { ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';

export const SplitButton = ({ 
  label, 
  icon, 
  onClick, 
  options = [],
  color = 'primary',
  variant = 'contained',
  size = 'medium',
  sx = {}
}) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <React.Fragment>
      <ButtonGroup 
        variant={variant} 
        color={color} 
        ref={anchorRef} 
        aria-label="split button"
        size={size}
        sx={{ 
          borderRadius: '8px',
          boxShadow: variant === 'contained' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          ...sx 
        }}
      >
        <Button 
          onClick={onClick}
          startIcon={icon}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
            px: 2
          }}
        >
          {label}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
          sx={{ 
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            px: 0,
            minWidth: '36px'
          }}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1300,
        }}
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 12],
            },
          },
        ]}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement.includes('bottom') ? 'right top' : 'right bottom',
            }}
          >
            <Paper 
              sx={{ 
                borderRadius: '8px', 
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                overflow: 'visible',
                border: '1px solid',
                borderColor: 'divider',
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  bgcolor: 'background.paper',
                  transform: 'rotate(45deg)',
                  zIndex: 0,
                  right: 18,
                  ...(placement.includes('bottom') ? {
                    top: -7,
                    borderLeft: '1px solid',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  } : {
                    bottom: -7,
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  })
                }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      onClick={(event) => {
                        option.onClick(event);
                        handleClose(event);
                      }}
                      sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        py: 1.2,
                        px: 2.5,
                        '&:hover': { backgroundColor: 'primary.lighter' }
                      }}
                    >
                      {option.icon && <Box sx={{ mr: 1.5, display: 'flex', opacity: 0.8 }}>{option.icon}</Box>}
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};
