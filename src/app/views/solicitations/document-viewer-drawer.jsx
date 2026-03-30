'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DocIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DocumentDetail } from '../documents/document-detail';
import { useLoading } from '@/hooks';
import * as documentService from '@/app/services/document.service';
import { ServiceStatus } from '@/libs/service';

export function SolicitationDocumentViewerDrawer({ open, solicitation, onClose, onRefresh }) {
  const [selectedDocument, setSelectedDocument] = React.useState(undefined);
  const loading = useLoading();

  const handleViewDocument = async (docId) => {
    loading.show('Carregando...', 'Aguarde um momento');
    try {
      const result = await documentService.findOne(null, docId);
      if (result.header.status === ServiceStatus.SUCCESS) {
        setSelectedDocument(result.body);
      }
    } finally {
      loading.hide();
    }
  };

  const documents = solicitation?.documents || [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Visualizar documentos</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Solicitação #{solicitation?.number} - {solicitation?.description}
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {documents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhum documento gerado para esta solicitação.
            </Typography>
          </Box>
        ) : (
          documents.map((doc) => (
            <ListItem
              key={doc.id}
              sx={{
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              secondaryAction={
                <Box>
                  <Tooltip title="Visualizar/Editar">
                    <IconButton size="small" onClick={() => handleViewDocument(doc.id)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon>
                <DocIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={doc.invoiceNumber ? `NF ${doc.invoiceNumber}` : 'Documento sem número'}
                secondary={
                  <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" display="block">
                      Emissão: {doc.invoiceDate ? new Date(doc.invoiceDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Valor: {doc.invoiceValue ? doc.invoiceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))
        )}
      </List>

      <DocumentDetail
        document={selectedDocument}
        onClose={() => setSelectedDocument(undefined)}
        onSave={() => {
          setSelectedDocument(undefined);
          onRefresh?.();
        }}
      />
    </Drawer>
  );
}
