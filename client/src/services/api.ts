import type {
  AdminCollaboration,
  AdminStats,
  AdminUser,
  PublicCollaboration,
} from '../types';

const API_BASE = '/api';

export function getAdminToken(): string | null {
  return localStorage.getItem('sylla_admin_token');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('sylla_admin_token', token);
}

export function removeAdminToken(): void {
  localStorage.removeItem('sylla_admin_token');
}

export async function submitCollaboration(formData: FormData): Promise<{
  success: boolean;
  data?: {
    trackingCode: string;
    status: string;
    createdAt: string;
    category: string;
    fullName: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/collaborations`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau lors de la soumission.' };
  }
}

export async function getPublicCollaboration(trackingCode: string): Promise<{
  success: boolean;
  data?: PublicCollaboration;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/collaborations/track/${encodeURIComponent(trackingCode)}`);
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau lors de la consultation.' };
  }
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  admin?: AdminUser;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAdminToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur de connexion.' };
  }
}

export async function getAdminMe(): Promise<{
  success: boolean;
  admin?: AdminUser;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAdminCollaborations(params?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<{
  success: boolean;
  data?: AdminCollaboration[];
  counts?: AdminStats;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);

  try {
    const res = await fetch(`${API_BASE}/admin/collaborations?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAdminCollaborationDetail(id: string): Promise<{
  success: boolean;
  data?: AdminCollaboration;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCollaborationStatus(
  id: string,
  data: { status?: string; publicComment?: string; action?: string }
): Promise<{
  success: boolean;
  data?: AdminCollaboration;
  message?: string;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addInternalNote(
  id: string,
  content: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAdminCollaboration(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
