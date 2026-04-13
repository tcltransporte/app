'use client';

import React from 'react';
import { Breadcrumbs, Typography, Link, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

/**
 * Reusable Title component that renders breadcrumbs with responsive behavior.
 * On mobile, it only shows the last breadcrumb item as the title.
 * 
 * @param {Array} items - Array of breadcrumb objects: { label: React.ReactNode, href?: string, icon?: React.ReactNode }
 */
export const Title = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  const renderItemLabel = (item) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      {item.icon ? <Box component="span" sx={{ display: 'inline-flex', flex: '0 0 auto' }}>{item.icon}</Box> : null}
      <Box
        component="span"
        sx={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      >
        {item.label}
      </Box>
    </Box>
  );

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{
        '& .MuiBreadcrumbs-li': {
          fontSize: '0.875rem',
          // Hide all breadcrumb items on mobile except the last one
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          '&:last-child': {
            display: 'flex',
          }
        },
        '& .MuiBreadcrumbs-separator': {
          fontSize: '0.875rem',
          // Hide all separators on mobile
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center'
        }
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <Typography
              key={typeof item.label === 'string' ? item.label : index}
              color="text.primary"
              fontWeight={600}
              sx={{ minWidth: 0 }}
              component="span"
            >
              {renderItemLabel(item)}
            </Typography>
          );
        }

        if (item.href) {
          return (
            <Link
              key={typeof item.label === 'string' ? item.label : index}
              underline="hover"
              color="inherit"
              href={item.href}
              sx={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
            >
              {renderItemLabel(item)}
            </Link>
          );
        }

        return (
          <Typography
            key={typeof item.label === 'string' ? item.label : index}
            color="inherit"
            sx={{ minWidth: 0 }}
            component="span"
          >
            {renderItemLabel(item)}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
};
