import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('userToken'); return null; }
      return { id: payload.userId, name: payload.name, email: payload.email };
    } catch { return null; }
  });

  function login(token, userData) {
    localStorage.setItem('userToken', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('userToken');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
