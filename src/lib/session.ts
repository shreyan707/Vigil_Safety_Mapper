import { User } from '@/src/types';

export function getStoredToken() {
  return localStorage.getItem('token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch (_error) {
    return null;
  }
}

export function setStoredSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function authHeaders(token = getStoredToken()) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
