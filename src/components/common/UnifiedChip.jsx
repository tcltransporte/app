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
  actionContent,
  showActionOnHover = false,
  forceShowAction = false,
  chipSx = {},
  actionSx = {}
}) {
  const hasAction = Boolean(actionContent || (actionLabel && onActionClick));

  return (
    <Box
      sx={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(hasAction && showActionOnHover
          ? {
              '& .unified-chip__action': { display: 'none' },
              '&:hover .unified-chip__chip, .MuiTableRow-root:hover & .unified-chip__chip': { display: 'none' },
              '&:hover .unified-chip__action, .MuiTableRow-root:hover & .unified-chip__action': { display: 'inline-flex' }
            }
          : {}),
        ...(hasAction && forceShowAction
          ? {
              '& .unified-chip__chip': { display: 'none' },
              '& .unified-chip__action': { display: 'inline-flex' }
            }
          : {})
      }}
      onClick={onClick}
    >
      <Chip
        className="unified-chip__chip"
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
          ...chipSx
        }}
      />

      {hasAction && (
        actionContent ? (
          <Box
            className="unified-chip__action"
            sx={{
              display: showActionOnHover ? undefined : 'inline-flex',
              height: 24,
              alignItems: 'center',
              ...actionSx
            }}
          >
            {actionContent}
          </Box>
        ) : (
          <Button
            className="unified-chip__action"
            size="small"
            variant={actionVariant}
            color={actionColor}
            startIcon={actionIcon}
            title={title || actionLabel}
            onClick={(e) => {
              e.stopPropagation();
              onActionClick(e);
            }}
            sx={{
              display: showActionOnHover ? undefined : 'inline-flex',
              minWidth: 84,
              height: 24,
              minHeight: 24,
              py: 0,
              px: 1,
              lineHeight: 1.2,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              ...actionSx
            }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
}
