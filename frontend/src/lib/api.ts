const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const api = {
  async parseError(response: Response): Promise<Error> {
    // Try to surface NestJS / HTTPException messages instead of generic statusText.
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body: any = await response.json();
        const msg = body?.message;
        if (Array.isArray(msg)) return new Error(msg.join(', '));
        if (typeof msg === 'string' && msg.trim()) return new Error(msg);
        if (typeof body?.error === 'string' && body.error.trim()) return new Error(body.error);
      } else {
        const text = await response.text();
        if (text?.trim()) return new Error(text);
      }
    } catch {
      // ignore parse failures
    }
    return new Error(`API error: ${response.status} ${response.statusText}`);
  },

  async get<T>(endpoint: string): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json();
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json();
  },
};

