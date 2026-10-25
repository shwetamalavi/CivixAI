const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getIssues(filters = {}) {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'ALL') query.set('category', filters.category);
    if (filters.status && filters.status !== 'ALL') query.set('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') query.set('priority', filters.priority);
    if (filters.department && filters.department !== 'ALL') query.set('department', filters.department);
    if (filters.search) query.set('search', filters.search);

    const res = await fetch(`${API_BASE}/issues?${query.toString()}`);
    return res.json();
  },

  async getNearbyIssues(lng, lat, maxDistance = 5000) {
    const res = await fetch(`${API_BASE}/issues/nearby?lng=${lng}&lat=${lat}&maxDistance=${maxDistance}`);
    return res.json();
  },

  async reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`${API_BASE}/issues/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[api.reverseGeocode error, falling back to direct geocode]', err);
    }

    // Direct browser fallback to BigDataCloud
    try {
      const direct = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (direct.ok) {
        const bdc = await direct.json();
        const locality = bdc.locality || '';
        const city = bdc.city || '';
        const state = bdc.principalSubdivision || '';
        const country = bdc.countryName || '';
        const parts = [locality, city && city !== locality ? city : '', state, country].filter(Boolean);
        return {
          formattedAddress: parts.join(', ') || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
          city: city || locality || 'Local Municipality',
          area: locality,
          state,
        };
      }
    } catch (e) {
      // Fallback
    }

    return {
      formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
      city: '',
    };
  },


  async getIssueById(id) {
    const res = await fetch(`${API_BASE}/issues/${id}`);
    return res.json();
  },

  async createIssue(formData) {
    // If formData is FormData, don't set Content-Type header so browser sets multipart boundary
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      body: isFormData ? formData : JSON.stringify(formData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async updateIssueStatus(id, { status, note, updatedBy, resolutionPhotoUrl }) {
    const res = await fetch(`${API_BASE}/issues/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, updatedBy, resolutionPhotoUrl }),
    });
    return res.json();
  },

  async upvoteIssue(id) {
    const res = await fetch(`${API_BASE}/issues/${id}/upvote`, {
      method: 'POST',
    });
    return res.json();
  },

  async addComment(id, { author, text, isOfficial }) {
    const res = await fetch(`${API_BASE}/issues/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, isOfficial }),
    });
    return res.json();
  },

  async previewAiAnalysis(payload) {
    const isFormData = payload instanceof FormData;
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify(payload),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async getAiStatus() {
    const res = await fetch(`${API_BASE}/ai/status`);
    return res.json();
  },

  async updateAiKey(apiKey) {
    const res = await fetch(`${API_BASE}/ai/set-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    return res.json();
  },

  async simulateAiFailure(simulate) {
    const res = await fetch(`${API_BASE}/ai/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulate }),
    });
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/analytics/audit-logs`);
    return res.json();
  },

  async sendOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async verifyOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async citizenLogin(credentials) {
    const res = await fetch(`${API_BASE}/auth/citizen-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async adminLogin(credentials) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async getDemoAccounts() {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    return res.json();
  },

  async getSmsStatus() {
    const res = await fetch(`${API_BASE}/auth/sms-status`);
    return res.json();
  },

  async updateSmsKey(payload) {
    const res = await fetch(`${API_BASE}/auth/set-sms-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getGisConfig() {
    const res = await fetch(`${API_BASE}/gis/config`);
    return res.json();
  },

  async updateGisConfig(payload) {
    const res = await fetch(`${API_BASE}/gis/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

