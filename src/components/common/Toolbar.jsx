'use client';

import React from 'react';
import { Box, Paper, Button, InputBase, IconButton, Fade, Slide, Fab } from '@mui/material';
import { keyframes } from '@mui/system';

const slideUp = keyframes`
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
`;
import {
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { Zoom } from '@mui/material';
import { useLayout } from '@/context/LayoutContext';
import { PrimaryAction } from './PrimaryAction';
import { SecondaryActions } from './SecondaryActions';

export const Toolbar = ({
  primary,
  secondary,
}) => {
  const { isMobile } = useLayout();
  const [showActions, setShowActions] = React.useState(true);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const scrollableRef = React.useRef(null);

  React.useEffect(() => {
    if (!isMobile) {
      setShowActions(true);
      setShowBackToTop(false);
      return;
    }

    const handleScroll = (e) => {
      // In mobile, scrolling might happen in a parent container (e.g. Container.Content or Table Box)
      const target = e.target;
      const currentScrollY = target.scrollTop || window.scrollY;
      const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight;
      const clientHeight = target.clientHeight || window.innerHeight;

      if (target instanceof HTMLElement && target.scrollTop > 0) {
        scrollableRef.current = target;
      }
      
      // Scrolled down more than 10px
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        setShowActions(false);
      } 
      // Scrolled up more than 10px or near the top
      else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 50) {
        setShowActions(true);
      }

      // Check if at the bottom
      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 50;

      // Show "back to top" only if scrolled down enough and not at the bottom
      setShowBackToTop(currentScrollY > 400 && !isAtBottom);

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMobile]);

  const handleBackToTop = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to render actions based on type (array or element)
  const renderPrimary = () => {
    if (!primary) return null;
    if (Array.isArray(primary)) return <PrimaryAction actions={primary} />;
    return primary;
  };

  const renderSecondary = () => {
    if (!secondary) return null;
    if (Array.isArray(secondary)) {
      return <SecondaryActions actions={secondary} />;
    }
    return secondary;
  };

  // If mobile, actions are floating
  if (isMobile) {
    return (
      <Box sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: 2,
        zIndex: 1050,
      }}>
        <Zoom in={showActions} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, width: 56 }}>
            {renderPrimary()}
            {renderSecondary()}
          </Box>
        </Zoom>

        <Zoom in={showBackToTop} unmountOnExit>
          <Fab
            color="primary"
            size="medium"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            sx={{
              boxShadow: (theme) => theme.shadows[8],
              backgroundColor: 'background.paper',
              color: 'primary.main',
              '&:hover': { backgroundColor: 'background.default' }
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 2,
        px: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        animation: `${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        {renderPrimary()}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {renderSecondary()}
      </Box>
    </Box>
  );
};
