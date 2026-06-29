import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { sessionStorage.removeItem('userToken'); return null; }
      return { id: payload.userId, name: payload.name, email: payload.email, isAdmin: payload.isAdmin || false };
    } catch { return null; }
  });

  function login(token, userData) {
    sessionStorage.setItem('userToken', token);
    if (userData.isAdmin) sessionStorage.setItem('adminToken', token);
    setUser(userData);
  }

  function logout() {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('adminToken');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
