'use client';

import React from 'react';
import {
  Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions,
  Divider, CircularProgress, Backdrop, IconButton,
  useMediaQuery, useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function Content({ children }) {
  return <DialogContent sx={{ mt: 1 }}>{children}</DialogContent>;
}

function Actions({ children }) {
  return <DialogActions sx={{ p: 2.5, pt: 1.5 }}>{children}</DialogActions>;
}

export function Dialog({ open, loading, title, onClose, children, maxWidth = 'sm', width }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const breakpointKeys = ['xs', 'sm', 'md', 'lg', 'xl'];
  const isBreakpoint = width && breakpointKeys.includes(width);
  const effectiveMaxWidth = isBreakpoint ? width : maxWidth;
  const customWidth = width && !isBreakpoint ? width : null;

  if (!open) return null;

  if (loading) return (
    <Backdrop open sx={{ color: '#fff', zIndex: t => t.zIndex.modal + 1 }}>
      <CircularProgress color="inherit" size={56} />
    </Backdrop>
  );

  return (
    <MuiDialog 
      open 
      onClose={onClose} 
      fullWidth 
      maxWidth={customWidth ? false : effectiveMaxWidth}
      fullScreen={isMobile}
      PaperProps={{ 
        sx: { 
          borderRadius: isMobile ? 0 : 3,
          ...(customWidth && !isMobile && { width: customWidth, maxWidth: 'none' })
        } 
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, pr: 6 }}>
        {title}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      {children}
    </MuiDialog>
  );
}

Dialog.Content = Content;
Dialog.Actions = Actions;
