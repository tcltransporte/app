'use client';

import React from 'react';
import { Popper, Paper, ClickAwayListener, MenuList, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';

export function ActionMenu({
  open,
  anchorEl,
  onClose,
  items = [],
  placement = 'bottom-end',
  strategy = 'fixed',
  offset = [0, 0],
  minWidth = 180,
  zoomAwareVertical = false,
  autoFocusItem = true,
}) {
  const paperRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleScroll = () => {
      onClose?.();
    };

    // capture=true garante fechamento mesmo com scroll em containers internos.
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleMouseDownCapture = (event) => {
      const target = event.target;
      const clickedInsideMenu = paperRef.current?.contains(target);
      const clickedAnchor = anchorEl?.contains?.(target);

      if (!clickedInsideMenu && !clickedAnchor) {
        onClose?.();
      }
    };

    // captura = fecha imediatamente ao iniciar interação fora (inclui scrollbar drag)
    document.addEventListener('mousedown', handleMouseDownCapture, true);
    return () => document.removeEventListener('mousedown', handleMouseDownCapture, true);
  }, [open, onClose, anchorEl]);

  const effectiveAnchorEl = React.useMemo(() => {
    if (!zoomAwareVertical || !anchorEl || typeof window === 'undefined') return anchorEl;

    const rect = anchorEl.getBoundingClientRect();
    const rawZoom = Number(window.getComputedStyle(document.body).getPropertyValue('--app-zoom'));
    const zoom = Number.isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1;

    const correctedRect = {
      x: rect.x,
      y: rect.y / zoom,
      top: rect.top / zoom,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom / zoom,
      width: rect.width,
      height: rect.height / zoom,
      toJSON: () => ({})
    };

    return {
      getBoundingClientRect: () => correctedRect,
      contextElement: anchorEl
    };
  }, [anchorEl, zoomAwareVertical, open]);

  return (
    <Popper
      open={Boolean(open && anchorEl)}
      anchorEl={effectiveAnchorEl}
      placement={placement}
      strategy={strategy}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      modifiers={[{ name: 'offset', options: { offset } }]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          ref={paperRef}
          elevation={0}
          sx={{
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
            minWidth,
            borderRadius: 2,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }}
        >
          <MenuList autoFocusItem={autoFocusItem}>
            {items.flatMap((item, index) => {
              const keyBase = item.id || item.label || String(index);
              const nodes = [];

              if (item.dividerBefore) {
                nodes.push(<Divider key={`${keyBase}-divider`} />);
              }

              nodes.push(
                <MenuItem
                  key={`${keyBase}-item`}
                  disabled={Boolean(item.disabled)}
                  sx={item.sx}
                  onClick={() => {
                    onClose?.();
                    item.onClick?.();
                  }}
                >
                  {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              );

              return nodes;
            })}
          </MenuList>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

