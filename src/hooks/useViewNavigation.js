'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage navigation between a list view and a detail modal/view.
 * Synchronizes state with the URL history for back button support.
 * 
 * @param {string} basePath - The base URL of the list view (e.g., '/registers/partners')
 * @param {string|null|undefined} initialId - The ID passed from the route param
 */
export const useViewNavigation = (basePath, initialId) => {
  const [selectedId, setSelectedId] = useState(initialId);

  const getUrlId = useCallback(() => {
    if (typeof window === 'undefined') return initialId;
    const path = window.location.pathname;
    
    // If we are at the base path, no partner is selected (undefined)
    if (path === basePath || path === `${basePath}/`) return undefined;
    
    // Extract ID by removing the basePath
    const regex = new RegExp(`${basePath.replace(/\//g, '\\/')}\\/([^\\/]+)`);
    const match = path.match(regex);
    
    if (!match) return undefined;
    
    const id = match[1];
    // Return the ID found in the URL
    return id;
  }, [basePath, initialId]);

  const updateId = useCallback((id) => {
    // If id is undefined or null (adding), we use the base path
    // But we still push to history so the back button can close the modal
    const url = (id === undefined || id === null) ? basePath : `${basePath}/${id}`;
    window.history.pushState(null, '', url);
    setSelectedId(id);
  }, [basePath]);

  // Sync state with back/forward history events
  useEffect(() => {
    const handlePopState = () => setSelectedId(getUrlId());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getUrlId]);

  return {
    selectedId,
    setSelectedId: updateId
  };
};
