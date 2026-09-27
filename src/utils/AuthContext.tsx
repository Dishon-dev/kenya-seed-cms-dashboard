import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  roleId?: number;
  roleName?: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    axios.defaults.withCredentials = true;
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const refreshAccessToken = async () => {
      const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      const newToken = response.data?.token;
      if (newToken) {
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
      }
      return newToken;
    };
  
    // Clears the (now-confirmed-invalid) local session and sends the user
    // back to the login screen. Guarded against firing from the login page
    // itself, so this can never turn into a redirect loop.
    const forceLogoutAndRedirect = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };
  
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/api/auth/');
  
        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest?._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${newToken}`
              };
              return axios(originalRequest);
            }
            forceLogoutAndRedirect();
          } catch {
            // The session is confirmed dead: a real request failed with 401,
            // and refreshing it also failed. Send the user back to log in
            // rather than leaving them stuck on a page where every action
            // fails silently or with a confusing error.
            forceLogoutAndRedirect();
          }
        }
        return Promise.reject(error);
      }
    );
  
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
    const { token: newToken, user: newUser } = response.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    axios.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => {});
  };

  const hasPermission = (key: string) => {
    return user?.permissions?.includes(key) ?? false;
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
