'use client';

import React, { createContext, useState } from 'react';

export const SessionContext = createContext({
  session: { user: null, company: null },
  setSession: () => {},
});

export const SessionContextProvider = ({ children, initialSession = { user: null, company: null } }) => {
  const [session, setSession] = useState(initialSession);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
};
