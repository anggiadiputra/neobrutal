/**
 * 🔒 Client-side Auth & Navigation Guard Helpers (React SPA Version)
 */

export interface User {
  id: number;
  name: string;
  email: string;
  rdash_customer_id: number | null;
  is_admin: boolean;
}

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
};

/**
 * Guard for private pages: redirect to login if unauthenticated
 */
export const requireLogin = (): void => {
  if (typeof window !== 'undefined') {
    if (!isAuthenticated()) {
      window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
    }
  }
};

/**
 * Guard for admin pages: redirect to dashboard if not an admin
 */
export const requireAdmin = (): void => {
  if (typeof window !== 'undefined') {
    requireLogin();
    const user = getUser();
    if (user && !user.is_admin) {
      window.location.href = '/dashboard';
    }
  }
};

/**
 * Guard for guest pages (login/register): redirect to dashboard if authenticated
 */
export const requireGuest = (): void => {
  if (typeof window !== 'undefined') {
    if (isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }
};
