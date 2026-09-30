/* ================================================================
   DemoUserContext.tsx — React Context for Authentication & Role Sessions
   Phase 10.6: Demonstrates realistic industrial session authentication,
   login validation, session persistence, and secure logout/switch user.
   ================================================================ */

import React, { createContext, useContext, useState } from 'react';
import { DemoUser, DEMO_USERS } from '../types/user';

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: DemoUser;
}

interface DemoUserContextType {
  currentUser: DemoUser;
  isAuthenticated: boolean;
  loginTime: string | null;
  users: DemoUser[];
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  switchUser: (userId?: string) => void;
}

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined);

const AUTH_USER_KEY = 'machinax_auth_user_id';
const AUTH_TIME_KEY = 'machinax_auth_login_time';

export const DemoUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session check on initialization
  const [currentUser, setCurrentUser] = useState<DemoUser>(() => {
    try {
      const savedId = localStorage.getItem(AUTH_USER_KEY);
      const found = DEMO_USERS.find((u) => u.id === savedId);
      return found || DEMO_USERS[0];
    } catch {
      return DEMO_USERS[0];
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedId = localStorage.getItem(AUTH_USER_KEY);
      return Boolean(savedId && DEMO_USERS.some((u) => u.id === savedId));
    } catch {
      return false;
    }
  });

  const [loginTime, setLoginTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TIME_KEY);
    } catch {
      return null;
    }
  });

  // Authenticate user with credentials
  const login = async (username: string, password: string): Promise<AuthResponse> => {
    const trimmedUsername = username.trim().toLowerCase();

    const matchedUser = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === trimmedUsername && u.password === password
    );

    if (!matchedUser) {
      return {
        success: false,
        error: 'Invalid username or password. Please verify industrial credentials.',
      };
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    setLoginTime(timeStr);

    try {
      localStorage.setItem(AUTH_USER_KEY, matchedUser.id);
      localStorage.setItem(AUTH_TIME_KEY, timeStr);
    } catch {
      // ignore storage failure
    }

    return {
      success: true,
      user: matchedUser,
    };
  };

  // Log out current user and purge session
  const logout = () => {
    setIsAuthenticated(false);
    setLoginTime(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
    } catch {
      // ignore
    }
  };

  // Switch user explicitly: if userId provided, switches session; otherwise clears session for /login
  const switchUser = (userId?: string) => {
    if (userId) {
      const user = DEMO_USERS.find((u) => u.id === userId || u.username === userId);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLoginTime(timeStr);
        try {
          localStorage.setItem(AUTH_USER_KEY, user.id);
          localStorage.setItem(AUTH_TIME_KEY, timeStr);
        } catch {
          // ignore
        }
        return;
      }
    }
    logout();
  };

  return (
    <DemoUserContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loginTime,
        users: DEMO_USERS,
        login,
        logout,
        switchUser,
      }}
    >
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
