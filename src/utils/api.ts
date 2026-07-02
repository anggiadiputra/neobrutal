/**
 * 🚀 Ruangtunggu API Client Helper utilizing Native fetch (React SPA Version)
 */

export const getApiUrl = (): string => {
  return (import.meta.env.VITE_PUBLIC_API_URL as string) || 'http://localhost:3000';
};

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiFetch = async <T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> => {
  const url = `${getApiUrl()}${path}`;
  const { requireAuth = true, ...fetchOptions } = options;

  // Prepare default headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(fetchOptions.headers || {}),
  });

  // Automatically attach authorization token if required and present
  if (requireAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || (data && data.success === false)) {
      // Handle expired/invalid session globally
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined' && requireAuth) {
          console.warn('[API Client]: Session unauthorized or expired. Logging out.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Avoid loop if already on login page
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
      }

    class ApiError extends Error {
      status?: number;
      errors?: unknown;
    }

    const error = new ApiError(data.message || `API error: ${response.statusText}`);
    error.status = response.status;
    error.errors = data.errors || null;
    throw error;
  }

  return data as T;
};
