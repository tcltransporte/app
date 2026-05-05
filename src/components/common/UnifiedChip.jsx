'use client';

import React from 'react';
import { Box, Chip, Button } from '@mui/material';

export default function UnifiedChip({
  label,
  color = 'default',
  variant = 'outlined',
  size = 'small',
  title,
  onClick,
  actionLabel,
  actionIcon,
  actionColor = 'success',
  actionVariant = 'contained',
  onActionClick,
  showActionOnHover = false,
  chipSx = {},
  actionSx = {}
}) {
  const hasAction = Boolean(actionLabel && onActionClick);

  return (
    <Box
      sx={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClick}
    >
      <Chip
        label={label}
        size={size}
        variant={variant}
        color={color}
        title={title}
        sx={{
          height: 24,
          fontSize: '0.75rem',
          fontWeight: 800,
          userSelect: 'none',
          '& .MuiChip-label': {
            px: 1,
            py: 0
          },
          ...(hasAction && showActionOnHover ? { '.MuiTableRow-root:hover &': { display: 'none' } } : {}),
          ...chipSx
        }}
      />

      {hasAction && (
        <Button
          size="small"
          variant={actionVariant}
          color={actionColor}
          startIcon={actionIcon}
          title={title || actionLabel}
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          sx={{
            display: showActionOnHover ? 'none' : 'inline-flex',
            minWidth: 84,
            height: 24,
            minHeight: 24,
            py: 0,
            px: 1,
            lineHeight: 1.2,
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            ...(showActionOnHover ? { '.MuiTableRow-root:hover &': { display: 'inline-flex' } } : {}),
            ...actionSx
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
