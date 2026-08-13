import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, validateToken, logoutUser } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('vault_auth_token') || null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const savedToken = sessionStorage.getItem('vault_auth_token');
      const savedUser = sessionStorage.getItem('vault_user_info');
      
      if (savedToken && savedUser) {
        try {
          const isValid = await validateToken(savedToken);
          if (isValid) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } else {
            clearSession();
          }
        } catch {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } else {
        clearSession();
      }
      setIsInitializing(false);
    }
    initAuth();
  }, []);

  function clearSession() {
    sessionStorage.removeItem('vault_auth_token');
    sessionStorage.removeItem('vault_user_info');
    setToken(null);
    setUser(null);
  }

  const verifyCredentials = async (username, password) => {
    try {
      const result = await loginUser(username, password);
      if (result.authenticated) {
        return { success: true, data: result };
      }
      return { success: false, message: result.message || 'Incorrect email or password' };
    } catch (err) {
      return { success: false, message: 'Authentication server unreachable' };
    }
  };

  const commitSession = (result) => {
    const userInfo = { username: result.username, role: result.role };
    sessionStorage.setItem('vault_auth_token', result.token);
    sessionStorage.setItem('vault_user_info', JSON.stringify(userInfo));
    setToken(result.token);
    setUser(userInfo);
  };

  const login = async (username, password) => {
    const res = await verifyCredentials(username, password);
    if (res.success) {
      commitSession(res.data);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch {
        // Continue cleanup
      }
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isInitializing,
        login,
        verifyCredentials,
        commitSession,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
