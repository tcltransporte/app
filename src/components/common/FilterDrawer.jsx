'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button } from '@mui/material';
import { Close as CloseIcon, FilterAltOff as ClearIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';

/**
 * Reusable Filter Drawer component.
 * 
 * @param {object} props
 * @param {boolean} props.open - Whether the drawer is open
 * @param {function} props.onClose - Function to call when closing the drawer
 * @param {object} props.initialValues - Initial values for Formik
 * @param {function} props.onApply - Function to call with values when Apply is clicked
 * @param {function} props.onClear - Function to call to clear filters (gets setValues as param)
 * @param {string} props.title - Title of the drawer
 * @param {React.ReactNode} props.children - Filter fields to render inside Formik Form
 */
export function FilterDrawer({ 
  open, 
  onClose, 
  initialValues, 
  onApply, 
  onClear, 
  title = 'Filtros Avançados',
  children 
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, p: 0 }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) => {
            onApply(values);
            onClose();
          }}
        >
          {({ setValues }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                {/* We pass the whole formik context to children if it's a function, otherwise just children */}
                {typeof children === 'function' ? children({ setValues }) : children}
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  type="button"
                  color="inherit"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    if (onClear) onClear(setValues);
                    onClose();
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Limpar
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Aplicar
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Drawer>
  );
}
