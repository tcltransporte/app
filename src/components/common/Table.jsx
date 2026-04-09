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
  Divider,
  Fade,
  Slide,
  Skeleton,
  TableSortLabel
} from '@mui/material';
import { keyframes } from '@mui/system';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableHeader = ({ col, sortBy, sortOrder, onSort, width, onResize, isFirst }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: col.field });

  const handleResize = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const startWidth = e.currentTarget.parentElement.offsetWidth;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      onResize(col.field, newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 2,
    position: 'sticky',
    top: 0,
    backgroundColor: 'background.paper',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
    width: width || col.width || '100%',
    minWidth: width || col.width || 100,
    maxWidth: width || col.width || 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ...col.headerSx
  };

  return (
    <TableCell
      ref={setNodeRef}
      style={style}
      align={col.align || 'left'}
      sx={{ pl: isFirst ? 3 : 1, pr: 1 }}
      {...attributes}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', position: 'relative' }}>
        <Box
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            height: '100%',
            cursor: 'grab',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          {col.sortable !== false ? (
            <TableSortLabel
              active={sortBy === col.field}
              direction={sortBy === col.field ? sortOrder.toLowerCase() : 'asc'}
              onClick={(e) => {
                e.stopPropagation();
                onSort && onSort(col.field);
              }}
              sx={{
                '& .MuiTableSortLabel-icon': {
                  opacity: sortBy === col.field ? 1 : 0,
                  transition: 'opacity 0.2s ease-in-out',
                },
                '&:hover .MuiTableSortLabel-icon': {
                  opacity: 1,
                }
              }}
            >
              {col.headerName}
            </TableSortLabel>
          ) : (
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {col.headerName}
            </Typography>
          )}
        </Box>

        <Box
          onMouseDown={handleResize}
          sx={{
            position: 'absolute',
            right: 0,
            top: '25%',
            bottom: '25%',
            width: '2px',
            backgroundColor: 'divider',
            cursor: 'col-resize',
            transition: 'all 0.2s',
            zIndex: 20,
            '&:hover': {
              backgroundColor: 'primary.main',
              width: '4px',
              right: '-1px',
              top: 0,
              bottom: 0,
              borderRadius: '2px'
            }
          }}
        />
      </Box>
    </TableCell>
  );
};

const slideUp = keyframes`
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
`;
import { useLayout } from '@/context/LayoutContext';

export const Table = ({
  columns,
  items,
  selecteds = [],
  onSelect,
  onSelectAll,
  onRowDoubleClick,
  onSort,
  sortBy,
  sortOrder,
  onColumnsReorder,
  widths = {},
  onResize,
  rowKey = 'id',
  loading = false,
  containerSx = {},
  fixed = false
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.field === active.id);
      const newIndex = columns.findIndex((col) => col.field === over.id);
      onColumnsReorder && onColumnsReorder(arrayMove(columns, oldIndex, newIndex));
    }
  };
  const { isMobile } = useLayout();
  const longPressTimer = React.useRef(null);
  const isLongPress = React.useRef(false);
  const clickTimer = React.useRef(null);

  if (isMobile) {
    const handleCardTouchStart = (row) => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onSelect(row); // Select on long press
      }, 500);
    };

    const handleCardTouchEnd = (e, row) => {
      clearTimeout(longPressTimer.current);

      // If click was on checkbox or other interactive elements, don't trigger row click logic
      if (e.target.closest('button, input, [role="button"], .MuiCheckbox-root')) {
        return;
      }

      // If it wasn't a long press, handle the click logic
      if (!isLongPress.current) {
        if (selecteds.length > 0) {
          // If already in selection mode, any click toggles selection
          onSelect(row);
        } else {
          // If no selection, click opens the record
          onRowDoubleClick && onRowDoubleClick(row);
        }
      }
    };

    return (
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        animation: `${slideUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards`
      }}>
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
        {loading ? (
          Array.from(new Array(5)).map((_, index) => (
            <Paper key={`skeleton-${index}`} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1.5 }} />
                <Skeleton variant="text" width={`${40 + Math.floor(Math.random() * 40)}%`} height={24} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {columns.map((col, colIndex) => (
                  <Box key={`skeleton-col-${col.field}-${colIndex}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width={`${20 + Math.floor(Math.random() * 50)}%`} />
                  </Box>
                ))}
              </Box>
            </Paper>
          ))
        ) : items.length === 0 && !loading ? (
          <Box sx={{ py: 2, px: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Nenhum resultado encontrado
            </Typography>
          </Box>
        ) : items.map((row) => {
          const isItemSelected = selecteds.some(item => item[rowKey] === row[rowKey]);
          return (
            <Paper
              key={row[rowKey]}
              elevation={0}
              onMouseDown={() => handleCardTouchStart(row)}
              onMouseUp={(e) => handleCardTouchEnd(e, row)}
              onTouchStart={() => handleCardTouchStart(row)}
              onTouchEnd={(e) => handleCardTouchEnd(e, row)}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: isItemSelected ? 'primary.main' : 'divider',
                borderRadius: 2,
                backgroundColor: isItemSelected ? 'primary.lighter' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none', // Prevent text selection on long press
                '&:active': { transform: 'scale(0.98)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                <Checkbox
                  checked={isItemSelected}
                  size="small"
                  sx={{ p: 0, mr: 1.5, mt: 0.3 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(row);
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                    {row[columns[1]?.field] || row[columns[0]?.field]}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {columns.map((col, index) => {
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
                        {col.renderCell ? col.renderCell(row[col.field], row) : row[col.field]}
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
        overflowX: fixed ? 'hidden' : 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&::-webkit-scrollbar': { width: 6, height: 6 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 3 },
        animation: `${slideUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        ...containerSx
      }}
    >
      {isMounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <MuiTable stickyHeader size="small" sx={{ tableLayout: fixed ? 'fixed' : 'auto', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ backgroundColor: 'background.paper', zIndex: 3, width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                  <Checkbox
                    indeterminate={selecteds.length > 0 && selecteds.length < items.length}
                    checked={items.length > 0 && selecteds.length === items.length}
                    onChange={onSelectAll}
                  />
                </TableCell>
                <SortableContext
                  items={columns.map(c => c.field)}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((col, index) => (
                    <SortableHeader
                      key={col.field}
                      col={col}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={onSort}
                      width={widths[col.field]}
                      onResize={onResize}
                      isFirst={index === 0}
                    />
                  ))}
                </SortableContext>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(15)).map((_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    <TableCell padding="checkbox" sx={{ width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                      <Skeleton variant="rectangular" width={20} height={20} />
                    </TableCell>
                    {columns.map((col, colIndex) => (
                      <TableCell
                        key={`skeleton-cell-${col.field}-${colIndex}`}
                        sx={{
                          width: widths[col.field] || col.width || '100%',
                          minWidth: widths[col.field] || col.width || 100,
                          pl: colIndex === 0 ? 3 : 1,
                          pr: 1
                        }}
                      >
                        <Skeleton
                          variant="text"
                          width={`${20 + Math.floor(Math.random() * 60)}%`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} sx={{ py: 2, borderBottom: 'none' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Nenhum resultado encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : items.map((row) => {
                const isItemSelected = selecteds.some(item => item[rowKey] === row[rowKey]);
                return (
                  <TableRow
                    key={row[rowKey]}
                    hover
                    selected={isItemSelected}
                    onClick={(e) => {
                      if (e.detail === 1) {
                        clickTimer.current = setTimeout(() => {
                          if (typeof onSelect === 'function') onSelect(row);
                        }, 250);
                      }
                    }}
                    onDoubleClick={() => {
                      if (clickTimer.current) {
                        clearTimeout(clickTimer.current);
                        clickTimer.current = null;
                      }
                      onRowDoubleClick && onRowDoubleClick(row);
                    }}
                    onMouseDown={(e) => {
                      if (e.detail > 1) e.preventDefault();
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': { backgroundColor: 'primary.lighter' }
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    {columns.map((col, index) => (
                      <TableCell
                        key={col.field}
                        align={col.align || 'left'}
                        sx={{
                          fontSize: '0.8125rem',
                          width: widths[col.field] || col.width || '100%',
                          minWidth: widths[col.field] || col.width || 100,
                          maxWidth: widths[col.field] || col.width || 'none',
                          pl: index === 0 ? 3 : 1,
                          pr: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          ...((typeof col.sx === 'function' ? col.sx(row) : col.sx) || {})
                        }}
                      >
                        {col.renderCell ? col.renderCell(row[col.field], row) : row[col.field]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </MuiTable>
        </DndContext>
      ) : (
        <MuiTable stickyHeader size="small" sx={{ tableLayout: fixed ? 'fixed' : 'auto', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ backgroundColor: 'background.paper', zIndex: 3, width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                <Checkbox
                  indeterminate={selecteds.length > 0 && selecteds.length < items.length}
                  checked={items.length > 0 && selecteds.length === items.length}
                  onChange={onSelectAll}
                />
              </TableCell>
              {columns.map((col, index) => (
                <TableCell
                  key={col.field}
                  align={col.align || 'left'}
                  sx={{
                    fontWeight: 700,
                    backgroundColor: 'background.paper',
                    whiteSpace: 'nowrap',
                    pl: index === 0 ? 3 : 1,
                    pr: 1,
                    ...col.headerSx
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Same skeleton/data logic for SSR */}
            {loading ? (
              Array.from(new Array(15)).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  <TableCell padding="checkbox" sx={{ width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                    <Skeleton variant="rectangular" width={20} height={20} />
                  </TableCell>
                  {columns.map((col, colIndex) => (
                    <TableCell 
                      key={`skeleton-cell-${col.field}-${colIndex}`}
                      sx={{
                        width: col.width || '100%',
                        minWidth: col.width || 100,
                        pl: colIndex === 0 ? 3 : 1,
                        pr: 1
                      }}
                    >
                      <Skeleton
                        variant="text"
                        width={`${20 + Math.floor(Math.random() * 60)}%`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} sx={{ py: 2, borderBottom: 'none' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Nenhum resultado encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : items.map((row) => {
              const isItemSelected = selecteds.some(item => item[rowKey] === row[rowKey]);
              return (
                <TableRow
                  key={row[rowKey]}
                  hover
                  selected={isItemSelected}
                  onMouseDown={(e) => {
                    if (e.detail > 1) e.preventDefault();
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { backgroundColor: 'primary.lighter' }
                  }}
                >
                  <TableCell padding="checkbox" sx={{ width: 80, minWidth: 80, pl: 2, pr: 5 }}>
                    <Checkbox checked={isItemSelected} />
                  </TableCell>
                  {columns.map((col, index) => (
                    <TableCell
                      key={col.field}
                      align={col.align || 'left'}
                      sx={{
                        fontSize: '0.8125rem',
                        width: col.width || '100%',
                        minWidth: col.width || 100,
                        maxWidth: col.width || 'none',
                        pl: index === 0 ? 3 : 1,
                        pr: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        ...(typeof col.sx === 'function' ? col.sx(row) : col.sx)
                      }}
                    >
                      {col.renderCell ? col.renderCell(row[col.field], row) : row[col.field]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </MuiTable>
      )}
    </TableContainer>
  );
};
