'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useLoadingContext } from '@/context/LoadingContext';

/**
 * Hook to manage loading overlay state via global context.
 * No longer requires rendering a component in the view.
 */
export function useLoading(initialState = {}) {
  const { show: contextShow, hide: contextHide } = useLoadingContext();
  const loadingId = useRef(null);
  const [active, setActive] = useState(false);

  const show = useCallback((title, subtitle) => {
    // If already showing, update by hiding and showing again
    if (loadingId.current) {
      contextHide(loadingId.current);
    }
    setActive(true);
    loadingId.current = contextShow(
      title || initialState?.title, 
      subtitle !== undefined ? subtitle : initialState?.subtitle
    );
  }, [contextShow, contextHide]); // Removed initialState from dependencies

  const hide = useCallback(() => {
    if (loadingId.current) {
      contextHide(loadingId.current);
      loadingId.current = null;
    }
    setActive(false);
  }, [contextHide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingId.current) {
        contextHide(loadingId.current);
      }
    };
  }, [contextHide]);

  return {
    show,
    hide,
    isLoading: active
  };
}
