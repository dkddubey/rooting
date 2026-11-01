import { User, Ancestor, AncestorMatchItem, UserConnectionItem, KinshipDetails } from '../types/index.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('rootsconnect_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T = any>(res: Response, fallbackErrorMsg = 'Request failed'): Promise<T> {
  const text = await res.text();
  let data: any = null;

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (typeof data === 'string' && data.length < 200 ? data : null) ||
      `${fallbackErrorMsg} (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return (data ?? {}) as T;
}

export const api = {
  // Auth & Profile
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return parseResponse(res, 'Login failed');
  },

  async register(data: { email: string; password: string; name: string; bio?: string; originPlaces?: string[] }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return parseResponse(res, 'Registration failed');
  },

  async resetPassword(email: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    return parseResponse(res, 'Password reset failed');
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return parseResponse<User>(res, 'Failed to load user profile');
  },

  async updateProfile(data: { name?: string; bio?: string; originPlaces?: string[]; avatarUrl?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return parseResponse<User>(res, 'Failed to update profile');
  },

  async getDemoUsers(): Promise<Array<{ id: string; name: string; email: string; bio: string; originPlaces?: string[] }>> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return parseResponse(res, 'Failed to retrieve demo users');
  },

  async switchDemo(email: string) {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return parseResponse(res, 'Failed to switch demo user');
  },

  // Ancestors & Trees
  async getMyAncestors(): Promise<Ancestor[]> {
    const res = await fetch(`${API_BASE}/ancestors`, { headers: getHeaders() });
    return parseResponse<Ancestor[]>(res, 'Failed to load ancestors');
  },

  async getTreeGraph(userId?: string): Promise<{ nodes: Array<{ id: string; data: Ancestor }>; edges: any[] }> {
    const url = userId ? `${API_BASE}/ancestors/tree?userId=${userId}` : `${API_BASE}/ancestors/tree`;
    const res = await fetch(url, { headers: getHeaders() });
    return parseResponse(res, 'Failed to load tree graph');
  },

  async createAncestor(data: Partial<Ancestor>): Promise<Ancestor> {
    const res = await fetch(`${API_BASE}/ancestors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return parseResponse<Ancestor>(res, 'Failed to create ancestor');
  },

  async updateAncestor(id: string, data: Partial<Ancestor>): Promise<Ancestor> {
    const res = await fetch(`${API_BASE}/ancestors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return parseResponse<Ancestor>(res, 'Failed to update ancestor');
  },

  async deleteAncestor(id: string) {
    const res = await fetch(`${API_BASE}/ancestors/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return parseResponse(res, 'Failed to delete ancestor');
  },

  // Matches
  async getMatches(): Promise<AncestorMatchItem[]> {
    const res = await fetch(`${API_BASE}/matches`, { headers: getHeaders() });
    return parseResponse<AncestorMatchItem[]>(res, 'Failed to load matches');
  },

  async acceptMatch(id: string) {
    const res = await fetch(`${API_BASE}/matches/${id}/accept`, {
      method: 'POST',
      headers: getHeaders()
    });
    return parseResponse(res, 'Failed to accept match');
  },

  async dismissMatch(id: string) {
    const res = await fetch(`${API_BASE}/matches/${id}/dismiss`, {
      method: 'POST',
      headers: getHeaders()
    });
    return parseResponse(res, 'Failed to dismiss match');
  },

  async triggerScan() {
    const res = await fetch(`${API_BASE}/matches/scan`, {
      method: 'POST',
      headers: getHeaders()
    });
    return parseResponse(res, 'Failed to run match scan');
  },

  // Connections & Kinship
  async getConnections(): Promise<UserConnectionItem[]> {
    const res = await fetch(`${API_BASE}/connections`, { headers: getHeaders() });
    return parseResponse<UserConnectionItem[]>(res, 'Failed to load connections');
  },

  async sendConnectionRequest(receiverId: string, relationType: 'RELATIVE' | 'FRIEND' = 'RELATIVE', notes?: string) {
    const res = await fetch(`${API_BASE}/connections/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiverId, relationType, notes })
    });
    return parseResponse(res, 'Failed to send connection request');
  },

  async respondConnection(id: string, status: 'ACCEPTED' | 'REJECTED') {
    const res = await fetch(`${API_BASE}/connections/respond/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return parseResponse(res, 'Failed to respond to connection request');
  },

  async getKinship(otherUserId: string): Promise<KinshipDetails> {
    const res = await fetch(`${API_BASE}/connections/kinship/${otherUserId}`, {
      headers: getHeaders()
    });
    return parseResponse<KinshipDetails>(res, 'Failed to compute kinship');
  },

  // Seed Reset
  async resetSeed() {
    const res = await fetch(`${API_BASE}/seed/reset-seed`, { method: 'POST' });
    return parseResponse(res, 'Failed to reset seed');
  }
};
