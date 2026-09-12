const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getDados: () => request('/dados'),
  getEventos: () => request('/eventos'),
  getFrota: () => request('/frota'),
  getFrotaById: (id) => request(`/frota/${encodeURIComponent(id)}`),
  createFrota: (payload) => request('/frota', { method: 'POST', body: JSON.stringify(payload) }),
  updateFrota: (id, payload) => request(`/frota/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteFrota: (id) => request(`/frota/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Compatibilidade com a rota antiga do projeto.
  updateTelemetria: (id, payload) => request(`/telemetria/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
};

export { API_BASE };
