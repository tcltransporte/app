'use client';

import React from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon, Code as XmlIcon } from '@mui/icons-material';

export default function DFeDistributionXmlViewer({ open, onClose, xml, nsu }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: '80%', md: 600 }, p: 0 }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <XmlIcon />
            <Typography variant="h6" fontWeight={700}>XML Distribuição (NSU: {nsu})</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
          <Box
            component="pre"
            sx={{
              margin: 0,
              padding: 2,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              overflowX: 'auto',
              fontSize: '0.75rem',
              fontFamily: '"Fira Code", "Roboto Mono", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.5
            }}
          >
            {xml || 'Nenhum conteúdo disponível ou erro ao carregar.'}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
