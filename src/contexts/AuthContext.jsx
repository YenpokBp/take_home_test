import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Cek sesi aktif saat app pertama kali dimuat
  useEffect(() => {
    client
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    setUser(res.data.data.user);
    return res.data;
  }

  async function register(formData) {
    const res = await client.post('/auth/register', formData);
    return res.data;
  }

  async function logout() {
    await client.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
