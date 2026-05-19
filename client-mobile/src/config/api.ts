import { useStore } from '../../store/useStore';

const API_URL = 'https://buyforce-class-ready.onrender.com';

export async function fetchGroups() {
  const res = await fetch(`${API_URL}/api/groups`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 401) {
    useStore.getState().logout();
  }
  return response;
}

export { API_URL as API_BASE_URL };