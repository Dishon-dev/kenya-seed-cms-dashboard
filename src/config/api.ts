export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

export const apiUrl = (pathname: string): string => {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${API_BASE}${cleanPath}`;
};
