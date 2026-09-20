const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:9090/api`;

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshQueue.push(cb);
};

const onRefreshed = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${BASE_URL}${path}`;
  const method = options?.method || 'GET';
  
  console.log(
    `%c[API Request] ${method} %c${fullUrl} %c(Auth: ${token ? 'Bearer Token Active' : 'No Token'})`, 
    'color: #0f0f0f; background-color: #d4af37; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
    'color: #d4af37; font-weight: bold;',
    'color: #888;'
  );

  if (options?.body) {
    try {
      const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      console.log(
        '%c[API Request Body]', 
        'color: #d4af37; font-weight: bold;',
        parsedBody
      );
    } catch {
      console.log(
        '%c[API Request Body]', 
        'color: #d4af37; font-weight: bold;',
        options.body
      );
    }
  }

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers
    });

    if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            console.log("%c[Auth] Token expired (401). Attempting automatic refresh...", "color: #d4af37; font-weight: bold;");
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              if (data && data.success && data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                if (data.refreshToken) {
                  localStorage.setItem('refreshToken', data.refreshToken);
                }
                isRefreshing = false;
                onRefreshed(data.accessToken);
              } else {
                throw new Error('Refresh response missing token');
              }
            } else {
              throw new Error('Refresh request failed');
            }
          } catch (refreshErr) {
            isRefreshing = false;
            console.warn("%c[Auth] Token refresh attempt failed. Preserving active session with fallback.", "color: #d4af37; font-weight: bold;", refreshErr);
            throw new Error('Authentication token refresh unavailable');
          }
        }

        // Return a promise that resolves with the retried request
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            const retryHeaders = {
              ...headers,
              'Authorization': `Bearer ${newToken}`
            };
            fetch(fullUrl, { ...options, headers: retryHeaders })
              .then((retryRes) => {
                if (!retryRes.ok) {
                  return retryRes.json().catch(() => ({ message: retryRes.statusText })).then((err) => {
                    reject(new Error(err.message || `HTTP Error: ${retryRes.status}`));
                  });
                }
                return retryRes.json().then((data) => resolve(data));
              })
              .catch((err) => reject(err));
          });
        });
      } else {
        console.warn("%c[Auth] 401 response without refresh token. Failing gracefully without session wipe.", "color: #d4af37; font-weight: bold;");
        throw new Error('Unauthorized');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      console.error(
        `%c[API Response Error] %c${res.status} ${res.statusText} %cfor ${path} | Message: ${error.message || 'Unknown Error'}`, 
        'color: white; background-color: #ef4444; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
        'color: #ef4444; font-weight: bold;',
        'color: #bbb;'
      );
      throw new Error(error.message || `HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    console.log(
      `%c[API Response Success] %c${res.status} OK %cfor ${path}`, 
      'color: #0f0f0f; background-color: #22c55e; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
      'color: #22c55e; font-weight: bold;',
      'color: #888;'
    );
    return data;
  } catch (err: any) {
    console.error(
      `%c[API Connection Failed] %cNetwork Failure %cfor ${path} | Error: ${err.message}`, 
      'color: white; background-color: #ef4444; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
      'color: #ef4444; font-weight: bold;',
      'color: #bbb;'
    );
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' })
};
