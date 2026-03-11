'use client';

import React from 'react';
import { Breadcrumbs, Typography, Link, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

/**
 * Reusable Title component that renders breadcrumbs with responsive behavior.
 * On mobile, it only shows the last breadcrumb item as the title.
 * 
 * @param {Array} items - Array of breadcrumb objects: { label: string, href?: string }
 */
export const Title = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{
        '& .MuiBreadcrumbs-li': {
          fontSize: '0.875rem',
          // Hide all breadcrumb items on mobile except the last one
          display: { xs: 'none', md: 'block' },
          '&:last-child': {
            display: 'block',
          }
        },
        '& .MuiBreadcrumbs-separator': {
          fontSize: '0.875rem',
          // Hide all separators on mobile
          display: { xs: 'none', md: 'block' }
        }
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <Typography
              key={item.label}
              color="text.primary"
              fontWeight={600}
            >
              {item.label}
            </Typography>
          );
        }

        if (item.href) {
          return (
            <Link
              key={item.label}
              underline="hover"
              color="inherit"
              href={item.href}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <Typography
            key={item.label}
            color="inherit"
          >
            {item.label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
};
