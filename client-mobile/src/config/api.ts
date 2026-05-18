// CHANGE TO PROPER BACKEND URL
const API_URL = 'http://172.20.30.106:4000';

export async function fetchGroups() {
  const res = await fetch(`${API_URL}/api/groups`);

  if (!res.ok) {
    throw new Error('Failed to fetch groups');
  }

  return res.json();
}
export { API_URL as API_BASE_URL };