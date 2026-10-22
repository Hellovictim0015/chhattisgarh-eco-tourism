import { ADMIN_LOGIN_REQUIRED } from '@/lib/site';
import { readJson } from '@/lib/compressImage';

// fetch() for the admin APIs: adds the admin token and sends the admin back to login when it has expired.
export async function adminFetch(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (res.status === 401 && ADMIN_LOGIN_REQUIRED) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/auth';
    throw new Error('Session expired');
  }
  return readJson(res);
}

export const adminToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);
