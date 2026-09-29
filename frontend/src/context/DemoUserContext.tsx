/* ================================================================
   DemoUserContext.tsx — React Context for Demo User Selection
   Phase 10: Allows switching between the 4 demonstration users
   ================================================================ */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DemoUser, DEMO_USERS } from '../types/user';

interface DemoUserContextType {
  currentUser: DemoUser;
  switchUser: (userId: string) => void;
  users: DemoUser[];
}

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined);

const STORAGE_KEY = 'machinax_demo_user_id';

export const DemoUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DemoUser>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      const found = DEMO_USERS.find((u) => u.id === savedId);
      return found || DEMO_USERS[0]; // Default: Ananya Sharma (System Administrator)
    } catch {
      return DEMO_USERS[0];
    }
  });

  const switchUser = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem(STORAGE_KEY, user.id);
      } catch {
        // ignore
      }
    }
  };

  return (
    <DemoUserContext.Provider value={{ currentUser, switchUser, users: DEMO_USERS }}>
      {children}
    </DemoUserContext.Provider>
  );
};

export function useDemoUser(): DemoUserContextType {
  const ctx = useContext(DemoUserContext);
  if (!ctx) {
    throw new Error('useDemoUser must be used within a DemoUserProvider');
  }
  return ctx;
}
