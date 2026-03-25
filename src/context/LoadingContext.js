'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { LoadingOverlay } from '@/components/common/Loading';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loadings, setLoadings] = useState([]);

  const show = useCallback((title = 'Processando...', subtitle = 'Aguarde um momento') => {
    const id = Math.random().toString(36).substr(2, 9);
    setLoadings(prev => [...prev, { id, title, subtitle }]);
    return id;
  }, []);

  const hide = useCallback((id) => {
    setLoadings(prev => {
      if (!id) return prev.slice(0, -1);
      return prev.filter(l => l.id !== id);
    });
  }, []);

  const activeLoading = useMemo(() => loadings[loadings.length - 1], [loadings]);

  const contextValue = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <LoadingOverlay 
        open={loadings.length > 0} 
        title={activeLoading?.title} 
        subtitle={activeLoading?.subtitle} 
      />
    </LoadingContext.Provider>
  );
}

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};
