const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
const API_BASE = API_BASE_URL+"/api/person";

export const apiService = {
  // Person CRUD
  createPerson: async (person) => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error('Failed to create person');
    return res.json();
  },

  getPerson: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to get person');
    return res.json();
  },

  listPeople: async () => {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to list people');
    return res.json();
  },

  updatePerson: async (id, person) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error('Failed to update person');
    return res.json();
  },

  deletePerson: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete person');
    }
    return res.ok;
  },

  // Relationship CRUD
  addRelationship: async (sourceId, relationship) => {
    const res = await fetch(`${API_BASE}/${sourceId}/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relationship),
    });
    if (!res.ok) throw new Error('Failed to add relationship');
    return res.json();
  },

  removeRelationship: async (sourceId, targetId) => {
    const res = await fetch(`${API_BASE}/${sourceId}/relationships/${targetId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove relationship');
    return res.json();
  },

  // Graph & Relations
  getGraph: async (id, depth = 2) => {
    const res = await fetch(`${API_BASE}/${id}/graph?depth=${depth}`);
    if (!res.ok) throw new Error('Failed to get graph');
    return res.json();
  },

  getRelations: async (id, relationType) => {
    const res = await fetch(`${API_BASE}/${id}/relations/${relationType}`);
    if (!res.ok) throw new Error('Failed to get relations');
    return res.json();
  },
};
