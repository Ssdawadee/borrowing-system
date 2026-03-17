import axios from 'axios';
import { getStoredSession } from './auth';

const defaultApiBaseUrl = import.meta.env.DEV
  ? '/api'
  : `${window.location.protocol}//${window.location.hostname}:5000/api`;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
});

api.interceptors.request.use((request) => {
  const session = getStoredSession();

  if (session?.token) {
    request.headers.Authorization = `Bearer ${session.token}`;
  }

  return request;
});

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message || fallback;

    if (message === 'This equipment is no longer available for approval.') {
      return 'อุปกรณ์นี้หมด ไม่พร้อมให้อนุมัติ';
    }
    if (message === 'Category already exists.') {
      return 'มีหมวดหมู่นี้อยู่แล้ว';
    }
    if (
      message === 'User not found.' ||
      message === 'Invalid credentials.' ||
      message === 'No user found with this student ID.' ||
      message === 'No user found with this email.'
    ) {
      return 'ไม่พบบัญชีผู้ใช้';
    }
    if (message === 'รหัสนักศึกษา อีเมล หรือรหัสผ่านไม่ถูกต้อง') {
      return 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง';
    }
    return message;
  }

  return fallback;
};
