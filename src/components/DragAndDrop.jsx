'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography, IconButton, Stack } from '@mui/material';
import { CloudUpload as UploadIcon, InsertDriveFile as FileIcon, Close as CloseIcon } from '@mui/icons-material';

function fileLabel(item) {
  if (!item) return '';
  if (item instanceof File) return item.name;
  return item.name || 'certificado.pfx';
}

export function DragAndDrop({ files = [], title, accept = '.pfx', onChange, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const existing = files[0];

  const pickFiles = useCallback(
    (list) => {
      const arr = Array.from(list || []);
      if (arr.length === 0) return;
      onChange?.([arr[0]]);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;
      pickFiles(e.dataTransfer.files);
    },
    [disabled, pickFiles]
  );

  const handleClear = useCallback(() => {
    if (disabled) return;
    onChange?.([]);
  }, [disabled, onChange]);

  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <Paper
        variant="outlined"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        sx={{
          p: 2,
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
        onClick={() => !disabled && !existing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          disabled={disabled}
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {existing ? (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <FileIcon color="primary" />
              <Typography variant="body2" noWrap fontWeight={600}>
                {fileLabel(existing)}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              aria-label="Remover arquivo"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={2} justifyContent="center" sx={{ py: 2 }}>
            <UploadIcon color="action" />
            <Typography variant="body2" color="text.secondary" align="center">
              Arraste o arquivo aqui ou clique para selecionar ({accept})
            </Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
