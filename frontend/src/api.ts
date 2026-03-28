export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string, username: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

export function getUsername(): string {
  return localStorage.getItem('username') || '';
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
  }
  return res;
}
