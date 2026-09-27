export const withAuthFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true
): Promise<Response> => {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers, credentials: 'include' });
  if (response.status !== 401 || !retry) return response;

  const refresh = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!refresh.ok) return response;

  const data = await refresh.json().catch(() => null);
  if (data?.token) {
    localStorage.setItem('token', data.token);
    return withAuthFetch(input, init, false);
  }
  return response;
};
