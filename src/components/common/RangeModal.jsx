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
  { label: 'Todo o período', isAllPeriod: true, getValue: () => null },
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

const WEEKDAYS_SHORT_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const ptBRWeekdaysShort = {
  ...ptBR,
  localize: {
    ...ptBR.localize,
    day: (day) => WEEKDAYS_SHORT_PT[Number(day)] || '',
  },
};

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
  const startDateRef = React.useRef(null);

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

  const handleDateInputTab = React.useCallback((event) => {
    if (event.key !== 'Tab') return;

    const dialogRoot = event.currentTarget.closest('[role="dialog"]');
    if (!dialogRoot) return;

    const focusables = Array.from(
      dialogRoot.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);

    const currentIndex = focusables.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    event.preventDefault();
    const nextIndex = event.shiftKey
      ? Math.max(0, currentIndex - 1)
      : Math.min(focusables.length - 1, currentIndex + 1);
    const nextElement = focusables[nextIndex];
    if (nextElement && typeof nextElement.focus === 'function') {
      nextElement.focus();
    }
  }, []);

  // Detect active preset on open or initial dates change
  React.useEffect(() => {
    if (open) {
      const s = initialStart || '';
      const e = initialEnd || '';
      const f = initialField || (fieldOptions.length > 0 ? fieldOptions[0].value : '');
      
      if (!s || !e) {
        setActivePreset('Todo o período');
      } else {
      const found = PRESETS.find(p => {
        if (p.isAllPeriod) return false;
        const { start: ps, end: pe } = p.getValue();
        return format(ps, 'yyyy-MM-dd') === s && format(pe, 'yyyy-MM-dd') === e;
      });
      
      if (found) {
        setActivePreset(found.label);
      } else {
        setActivePreset(null);
      }
      }
      
      setDateRange([
        {
          startDate: safeParse(s) || new Date(),
          endDate: safeParse(e) || new Date(),
          key: 'selection'
        }
      ]);
      setField(f);

      // `autoFocus` can fail with dialog transitions; force focus after mount.
      setTimeout(() => {
        const input = startDateRef.current?.querySelector?.('input');
        if (input && typeof input.focus === 'function') input.focus();
      }, 0);
    }
  }, [open, initialStart, initialEnd, initialField, fieldOptions]);

  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);
    setActivePreset(null);
  };

  const handleApplyPreset = (preset) => {
    if (preset.isAllPeriod) {
      setActivePreset(preset.label);
      return;
    }

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
    const isAllPeriodSelected = activePreset === 'Todo o período';

    onApply({
      start: isAllPeriodSelected ? '' : format(dateRange[0].startDate, 'yyyy-MM-dd'),
      end: isAllPeriodSelected ? '' : format(dateRange[0].endDate, 'yyyy-MM-dd'),
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
          height: isMobile ? 'auto' : 400 
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
            <Box sx={{ p: isMobile ? 1 : 1.25, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={isMobile ? 1 : 1.5}>
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
                    ref={startDateRef}
                    onKeyDown={handleDateInputTab}
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
                    onKeyDown={handleDateInputTab}
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
              p: isMobile ? 0.5 : 1,
              backgroundColor: 'background.paper',
              '& .rdrCalendarWrapper': {
                color: 'text.primary',
                fontSize: '0.75rem',
                width: '100%',
                backgroundColor: 'transparent',
              },
              '& .rdrMonthAndYearWrapper': {
                minHeight: 36,
                paddingTop: 0
              },
              '& .rdrDateDisplayWrapper': {
                display: 'none',
              },
              '& .rdrMonth': {
                width: '100%',
              },
              '& .rdrWeekDay': {
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'none',
                lineHeight: 1.2,
              },
              '& .rdrDay': {
                height: 34,
              },
              '& .rdrDayNumber': {
                lineHeight: '34px',
              },
              '& .rdrDays': {
                rowGap: 0,
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
            }}>
              <DateRange
                editableDateInputs={false}
                onChange={handleSelect}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                months={isMobile ? 1 : 2}
                direction={isMobile ? 'vertical' : 'horizontal'}
                locale={ptBRWeekdaysShort}
                weekdayDisplayFormat="EEE"
                fixedHeight
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
