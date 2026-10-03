import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page refresh, restore the session from the saved token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then((res) => setTherapist(res.data.therapist))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, therapist }) => {
    localStorage.setItem('token', token);
    setTherapist(therapist);
  };

  const register = async (form) => saveSession((await api.post('/auth/register', form)).data);
  const login = async (form) => saveSession((await api.post('/auth/login', form)).data);
  const logout = () => {
    localStorage.removeItem('token');
    setTherapist(null);
  };

  return (
    <AuthContext.Provider value={{ therapist, setTherapist, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
