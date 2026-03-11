import { Session, UserRole } from '../types';

const STORAGE_KEY = 'ucbs-session';

export const getStoredSession = (): Session | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveSession = (session: Session) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getRoleHomePath = (role: UserRole) =>
  role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
