import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from './types';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from './api';

export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'DO', name: 'Rep. Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' }
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    countryCode: string;
    countryName: string;
    dialCode: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      setStoredAuth(token, res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      clearStoredAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setStoredAuth(res.token, res.user);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    countryCode: string;
    countryName: string;
    dialCode: string;
  }): Promise<User> => {
    const res = await api.register(data);
    setStoredAuth(res.token, res.user);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, refreshUser }}>
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
