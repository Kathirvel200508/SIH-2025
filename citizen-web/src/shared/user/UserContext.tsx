import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthCookie, getAuthFromCookie, clearAuthCookie } from "@/utils/cookies";

type User = {
  id: string;
  username: string;
  role: "admin" | "citizen";
};

type UserContextValue = {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isLoggedIn: boolean;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing authentication in cookies
    const { token: cookieToken, role, userId, username } = getAuthFromCookie();
    if (cookieToken && role === 'citizen' && userId && username) {
      setToken(cookieToken);
      setUser({ id: userId, username, role: 'citizen' });
    }
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser && token) {
      // Persist user data to cookies when both user and token are set
      setAuthCookie(token, newUser.role, newUser.id, newUser.username);
    }
  };

  const handleSetToken = (newToken: string | null) => {
    setToken(newToken);
    if (!newToken) {
      handleSetUser(null);
      clearAuthCookie();
    } else if (user) {
      // Persist token to cookies when both token and user are set
      setAuthCookie(newToken, user.role, user.id, user.username);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthCookie();
  };

  const value: UserContextValue = {
    user,
    token,
    setUser: handleSetUser,
    setToken: handleSetToken,
    isLoggedIn: !!token && !!user,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}


