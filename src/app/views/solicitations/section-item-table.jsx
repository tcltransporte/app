'use client';

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

/**
 * A themed section with a header and a table for listing solicitation items (pieces or services).
 */
export const SectionItemTable = ({
  title,
  columns = [],
  items = [],
  onAdd,
  onEdit,
  onDelete,
  actions = []
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const handleOpenMenu = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 1.25,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8
      }}>
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions.map((action, idx) => (
            <Button
              key={idx}
              size="small"
              variant="contained"
              disableElevation
              onClick={action.onClick}
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                textTransform: 'none',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                px: 1.2,
                minHeight: 24,
                py: 0
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ fontWeight: 700, fontSize: '0.725rem', py: 0.75 }}>
                  {col.headerName}
                </TableCell>
              ))}
              <TableCell align="right" width={50} sx={{ py: 0.75 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="left" sx={{ pt: 1, pb: 1, px: 2, color: 'text.secondary', fontSize: '0.825rem' }}>
                  Não há itens na tabela.
                </TableCell>
              </TableRow>
            )}
            {items.map((item, index) => (
              <TableRow key={item.id || index} hover onDoubleClick={() => onEdit(item)}>
                {columns.map((col) => (
                  <TableCell key={col.field} sx={{ fontSize: '0.825rem', py: 0.5 }}>
                    {col.renderCell ? col.renderCell(item[col.field], item) : item[col.field]}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <IconButton size="small" onClick={(e) => handleOpenMenu(e, item)} sx={{ p: 0.5 }}>
                    <MoreVertIcon fontSize="inherit" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={columns.length + 1} sx={{ p: 0.5 }}>
                <Button
                  size="small"
                  onClick={onAdd}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.lighter' }
                  }}
                >
                  + Adicionar
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { onEdit(selectedItem); handleCloseMenu(); }}>Editar</MenuItem>
        <MenuItem onClick={() => { onDelete(selectedItem); handleCloseMenu(); }} sx={{ color: 'error.main' }}>Excluir</MenuItem>
      </Menu>
    </Box>
  );
};
