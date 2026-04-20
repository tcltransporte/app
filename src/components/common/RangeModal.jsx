'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
  addMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isAfter,
  isBefore,
  isValid,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-date-range';

// Import react-date-range styles
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';

import { Dialog } from './Dialog';
import { DateField } from '@/components/controls/DateField';
import { SelectField } from '@/components/controls/SelectField';

export const PRESETS = [
  { label: 'Hoje', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: 'Ontem', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'Semana atual', getValue: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 0 }), end: endOfWeek(new Date(), { weekStartsOn: 0 }) }) },
  { label: 'Semana passada', getValue: () => ({ start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }) }) },
  { label: 'Últimas 2 semanas', getValue: () => ({ start: startOfWeek(subWeeks(new Date(), 2), { weekStartsOn: 0 }), end: endOfWeek(new Date(), { weekStartsOn: 0 }) }) },
  { label: 'Mês atual', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Mês passado', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Ano atual', getValue: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }) },
  { label: 'Ano passado', getValue: () => ({ start: startOfYear(subYears(new Date(), 1)), end: endOfYear(subYears(new Date(), 1)) }) },
];

export function RangeModal({ 
  open, 
  onClose, 
  onApply, 
  title = 'Período', 
  initialStart, 
  initialEnd,
  initialField,
  fieldOptions = []
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const safeParse = (dateStr) => {
    if (!dateStr) return null;
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  };

  const [dateRange, setDateRange] = useState([
    {
      startDate: safeParse(initialStart) || new Date(),
      endDate: safeParse(initialEnd) || new Date(),
      key: 'selection'
    }
  ]);

  const [field, setField] = useState(initialField || (fieldOptions.length > 0 ? fieldOptions[0].value : ''));
  const [activePreset, setActivePreset] = useState(null);

  // Detect active preset on open or initial dates change
  React.useEffect(() => {
    if (open) {
      const s = initialStart || '';
      const e = initialEnd || '';
      const f = initialField || (fieldOptions.length > 0 ? fieldOptions[0].value : '');
      
      const found = PRESETS.find(p => {
        const { start: ps, end: pe } = p.getValue();
        return format(ps, 'yyyy-MM-dd') === s && format(pe, 'yyyy-MM-dd') === e;
      });
      
      if (found) {
        setActivePreset(found.label);
      } else {
        setActivePreset(null);
      }
      
      setDateRange([
        {
          startDate: safeParse(s) || new Date(),
          endDate: safeParse(e) || new Date(),
          key: 'selection'
        }
      ]);
      setField(f);
    }
  }, [open, initialStart, initialEnd, initialField, fieldOptions]);

  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);
    setActivePreset(null);
  };

  const handleApplyPreset = (preset) => {
    const { start: s, end: e } = preset.getValue();
    setDateRange([
      {
        startDate: s,
        endDate: e,
        key: 'selection'
      }
    ]);
    setActivePreset(preset.label);
  };

  const handleApply = () => {
    onApply({
      start: format(dateRange[0].startDate, 'yyyy-MM-dd'),
      end: format(dateRange[0].endDate, 'yyyy-MM-dd'),
      field
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="md">
      <Dialog.Content sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: isMobile ? 'auto' : 450 
        }}>
          {/* Sidebar Presets */}
          <Box sx={{ 
            width: isMobile ? '100%' : 220, 
            borderRight: isMobile ? 'none' : '1px solid', 
            borderBottom: isMobile ? '1px solid' : 'none',
            borderColor: 'divider', 
            overflowX: isMobile ? 'auto' : 'hidden',
            overflowY: isMobile ? 'hidden' : 'auto',
            backgroundColor: 'background.default'
          }}>
            <List sx={{ 
              p: 1, 
              display: isMobile ? 'flex' : 'block',
              gap: isMobile ? 1 : 0,
              whiteSpace: isMobile ? 'nowrap' : 'normal'
            }}>
              {PRESETS.map((preset) => (
                <ListItem key={preset.label} disablePadding sx={{ mb: isMobile ? 0 : 0.5, width: isMobile ? 'auto' : '100%' }}>
                  <ListItemButton
                    selected={activePreset === preset.label}
                    onClick={() => handleApplyPreset(preset)}
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      px: isMobile ? 2 : 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { backgroundColor: 'primary.dark' },
                      },
                    }}
                  >
                    <ListItemText primary={preset.label} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 500 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Calendar Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: isMobile ? 2 : 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={isMobile ? 1.5 : 2}>
                {fieldOptions.length > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SelectField
                      fullWidth
                      size="small"
                      label="Filtrar por"
                      value={field}
                      options={fieldOptions}
                      onChange={(val) => {
                        setField(val);
                        setActivePreset(null);
                      }}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 6, sm: fieldOptions.length > 0 ? 4 : 6 }}>
                  <DateField
                    label="Data Início"
                    fullWidth
                    size="small"
                    value={format(dateRange[0].startDate, 'yyyy-MM-dd')}
                    onChange={(val) => {
                      const d = safeParse(val);
                      if (d) setDateRange([{ ...dateRange[0], startDate: d }]);
                      setActivePreset(null);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: fieldOptions.length > 0 ? 4 : 6 }}>
                  <DateField
                    label="Data Fim"
                    fullWidth
                    size="small"
                    value={format(dateRange[0].endDate, 'yyyy-MM-dd')}
                    onChange={(val) => {
                      const d = safeParse(val);
                      if (d) setDateRange([{ ...dateRange[0], endDate: d }]);
                      setActivePreset(null);
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              p: isMobile ? 1 : 2,
              backgroundColor: 'background.paper',
              '& .rdrCalendarWrapper': {
                color: 'text.primary',
                fontSize: '0.8rem',
                width: '100%',
                backgroundColor: 'transparent',
              },
              '& .rdrDateDisplayWrapper': {
                display: 'none',
              },
              '& .rdrMonth': {
                width: '100%',
              },
              '& .rdrMonthAndYearWrapper': {
                 paddingTop: 0
              },
              '& .rdrMonthAndYearPickers select': {
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              },
              '& .rdrNextPrevButton': {
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                }
              },
              '& .rdrPprevButton i': {
                borderRightColor: 'text.secondary'
              },
              '& .rdrNextButton i': {
                borderLeftColor: 'text.secondary'
              },
              '& .rdrDayNumber span': {
                fontWeight: 500,
                color: 'text.primary'
              },
              '& .rdrDayPassive .rdrDayNumber span': {
                color: 'text.disabled'
              },
              '& .rdrDayToday .rdrDayNumber span:after': {
                background: theme => theme.palette.primary.main,
              },
              '& .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge': {
                background: theme => `${theme.palette.primary.main} !important`,
              },
              '& .rdrDayInPreview, .rdrDayEndPreview, .rdrDayStartPreview': {
                border: theme => `1px solid ${theme.palette.primary.main}`,
              },
              '& .rdrDayInPreview': {
                backgroundColor: 'action.hover',
              },
              '& .rdrInRange': {
                backgroundColor: theme => `${theme.palette.primary.light} !important`,
                color: theme => `${theme.palette.primary.contrastText} !important`,
              },
              '& .rdrDayDisabled': {
                backgroundColor: 'action.disabledBackground',
              },
              '& .rdrWeekDay': {
                color: 'text.secondary',
                fontWeight: 600
              }
            }}>
              <DateRange
                editableDateInputs={false}
                onChange={handleSelect}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                months={isMobile ? 1 : 2}
                direction={isMobile ? 'vertical' : 'horizontal'}
                locale={ptBR}
                rangeColors={['#6366f1']} // This should ideally come from theme or props
                showDateDisplay={false}
              />
            </Box>
          </Box>
        </Box>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600, px: 4 }}>
          Aplicar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
