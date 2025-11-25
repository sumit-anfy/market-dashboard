import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, setAuthTokenHeader, setUnauthorizedHandler } from '@/config/axiosClient';

type AuthStage = 'login' | 'otp' | 'authenticated';

type AuthContextValue = {
  token: string | null;
  username: string;
  stage: AuthStage;
  otpExpiresAt: string | null;
  loading: boolean;
  error: string | null;
  requestOtp: (username: string) => Promise<void>;
  verifyOtpCode: (otp: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseError = (error: any): string => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong, please try again.'
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('pendingUsername') || '');
  const [stage, setStage] = useState<AuthStage>(token ? 'authenticated' : 'login');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep axios Authorization header in sync with stored token
  useEffect(() => {
    setAuthTokenHeader(token);
  }, [token]);

  // Listen for unauthorized responses from axios
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const requestOtp = async (user: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/login', { username: user });
      setUsername(user);
      localStorage.setItem('pendingUsername', user);
      setOtpExpiresAt(response.data?.expiresAt || null);
      setStage('otp');
    } catch (err: any) {
      setError(parseError(err));
      setStage('login');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/verify-otp', {
        username,
        otp,
      });
      const issuedToken = response.data?.token;
      setToken(issuedToken);
      setStage('authenticated');
      setOtpExpiresAt(null);
      localStorage.removeItem('pendingUsername');
    } catch (err: any) {
      setError(parseError(err));
      setStage('otp');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setStage('login');
    setUsername('');
    setOtpExpiresAt(null);
    localStorage.removeItem('pendingUsername');
    setAuthTokenHeader(null);
  };

  const clearError = () => setError(null);

  const value = useMemo(
    () => ({
      token,
      username,
      stage,
      otpExpiresAt,
      loading,
      error,
      requestOtp,
      verifyOtpCode,
      logout,
      clearError,
    }),
    [
      token,
      username,
      stage,
      otpExpiresAt,
      loading,
      error,
      requestOtp,
      verifyOtpCode,
      logout,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
