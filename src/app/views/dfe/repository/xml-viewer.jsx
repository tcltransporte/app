import React from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon, Code as XmlIcon } from '@mui/icons-material';
import { formatXml, highlightXml } from '@/libs/xml-formatter';

export default function DFeDistributionXmlViewer({ open, onClose, xml, nsu }) {
  const formattedHtml = React.useMemo(() => {
    if (!xml) return null;
    try {
      const formatted = formatXml(xml);
      return highlightXml(formatted);
    } catch (e) {
      console.error('Error formatting XML:', e);
      return null;
    }
  }, [xml]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: '80%', md: 800 }, p: 0 }
      }}
    >
      <style>
        {`
          .xml-tag { color: #881280; font-weight: bold; }
          .xml-delimit { color: #881280; }
          .xml-attr { color: #994500; }
          .xml-value { color: #1a1aa6; }
          .xml-content { color: #000; }
        `}
      </style>
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

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#fff' }}>
          {formattedHtml ? (
            <Box
              component="pre"
              sx={{
                margin: 0,
                padding: 2,
                fontSize: '0.8rem',
                fontFamily: '"Fira Code", "Roboto Mono", monospace',
                whiteSpace: 'pre',
                lineHeight: 1.5,
                '& span': {
                  fontFamily: 'inherit'
                }
              }}
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {xml === undefined ? 'Carregando...' : 'Nenhum conteúdo disponível ou erro ao processar o XML.'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
