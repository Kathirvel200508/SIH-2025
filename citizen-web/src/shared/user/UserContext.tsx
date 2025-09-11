import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem("citizen_token");
    if (savedToken) {
      setToken(savedToken);
      // Try to decode user info from token or fetch from API
      // For now, we'll store user info in localStorage as well
      const savedUser = localStorage.getItem("citizen_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // Invalid user data, clear it
          localStorage.removeItem("citizen_user");
        }
      }
    }
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("citizen_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("citizen_user");
    }
  };

  const handleSetToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem("citizen_token", newToken);
    } else {
      localStorage.removeItem("citizen_token");
      // Clear user when token is cleared
      handleSetUser(null);
    }
  };

  const value: UserContextValue = {
    user,
    token,
    setUser: handleSetUser,
    setToken: handleSetToken,
    isLoggedIn: !!token && !!user,
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


