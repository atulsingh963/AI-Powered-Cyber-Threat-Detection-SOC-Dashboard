const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api/v1`;

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Events
  getEvents: (params?: { skip?: number; limit?: number; severity?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.append('skip', params.skip.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.severity) query.append('severity', params.severity);
    if (params?.search) query.append('search', params.search);
    return fetchApi<any[]>(`/events?${query.toString()}`);
  },

  // Incidents
  getIncidents: (params?: { skip?: number; limit?: number; severity?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.append('skip', params.skip.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return fetchApi<any[]>(`/incidents?${query.toString()}`);
  },

  getIncidentDetail: (id: string) => fetchApi<any>(`/incidents/${id}`),

  updateIncidentStatus: (id: string, data: { status?: string; assigned_to?: string; severity?: string }) =>
    fetchApi<any>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  addIncidentNote: (id: string, note: string) =>
    fetchApi<any>(`/incidents/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // AI Analyst
  analyzeIncident: (id: string) =>
    fetchApi<any>(`/ai/analyze/${id}`, {
      method: 'POST',
    }),

  // Rules
  getRules: () => fetchApi<any[]>('/detection-rules'),
  updateRule: (ruleId: string, data: { enabled?: boolean; severity?: string }) =>
    fetchApi<any>(`/detection-rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Simulator
  getSimulatorStatus: () => fetchApi<{ status: string; demo_mode: boolean }>('/simulator/status'),
  startSimulator: () => fetchApi<{ message: string; status: string }>('/simulator/start', { method: 'POST' }),
  stopSimulator: () => fetchApi<{ message: string; status: string }>('/simulator/stop', { method: 'POST' }),

  // Analytics & Health
  getAnalytics: () => fetchApi<any>('/analytics/overview'),
  getHealth: () => fetchApi<any>('/system/health'),
};
