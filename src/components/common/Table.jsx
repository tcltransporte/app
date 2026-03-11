'use client';

import React from 'react';
import { 
  Table as MuiTable, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Checkbox, 
  Paper,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useLayout } from '@/context/LayoutContext';

export const Table = ({ 
  columns, 
  items, 
  selecteds = [], 
  onSelect, 
  onSelectAll,
  onRowDoubleClick
}) => {
  const { isMobile } = useLayout();

  if (isMobile) {
    return (
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Mobile Select All Header */}
        {items.length > 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper'
            }}
          >
            <Checkbox
              indeterminate={selecteds.length > 0 && selecteds.length < items.length}
              checked={items.length > 0 && selecteds.length === items.length}
              onChange={onSelectAll}
              size="small"
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Selecionar todos ({items.length})
            </Typography>
          </Paper>
        )}

        {/* Mobile Data Cards */}
        {items.map((row) => {
          const isItemSelected = selecteds.indexOf(row.id) !== -1;
          return (
            <Paper
              key={row.id}
              elevation={0}
              onClick={() => onSelect(row.id)}
              onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: isItemSelected ? 'primary.main' : 'divider',
                borderRadius: 2,
                backgroundColor: isItemSelected ? 'primary.lighter' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:active': { transform: 'scale(0.98)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                <Checkbox 
                  checked={isItemSelected} 
                  size="small" 
                  sx={{ p: 0, mr: 1.5, mt: 0.3 }} 
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                    {row[columns[1]?.field] || row[columns[0]?.field]}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {columns.map((col, index) => {
                  // Skip the "ID" equivalent or already shown primary field if needed, 
                  // but here we show all for completeness as requested "caiba todos os dados"
                  return (
                    <Box key={col.field} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {col.headerName}:
                      </Typography>
                      <Typography 
                        variant="caption" 
                        fontWeight={600}
                        sx={{ 
                          textAlign: 'right',
                          ...(typeof col.sx === 'function' ? col.sx(row) : col.sx)
                        }}
                      >
                        {col.renderCell ? col.renderCell(row) : row[col.field]}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&::-webkit-scrollbar': { width: 6, height: 6 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 3 }
      }}
    >
      <MuiTable stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ backgroundColor: 'background.paper' }}>
              <Checkbox
                indeterminate={selecteds.length > 0 && selecteds.length < items.length}
                checked={items.length > 0 && selecteds.length === items.length}
                onChange={onSelectAll}
              />
            </TableCell>
            {columns.map((col) => (
              <TableCell 
                key={col.field} 
                align={col.align || 'left'}
                sx={{ 
                  fontWeight: 700, 
                  backgroundColor: 'background.paper', 
                  whiteSpace: 'nowrap',
                  ...col.headerSx
                }}
              >
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => {
            const isItemSelected = selecteds.indexOf(row.id) !== -1;
            return (
              <TableRow
                key={row.id}
                hover
                selected={isItemSelected}
                onClick={() => onSelect(row.id)}
                onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                sx={{ cursor: 'pointer', '&.Mui-selected': { backgroundColor: 'primary.lighter' } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={isItemSelected} />
                </TableCell>
                {columns.map((col) => (
                  <TableCell 
                    key={col.field} 
                    align={col.align || 'left'}
                    sx={{ 
                      fontSize: '0.8125rem',
                      ...(typeof col.sx === 'function' ? col.sx(row) : col.sx)
                    }}
                  >
                    {col.renderCell ? col.renderCell(row) : row[col.field]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};
