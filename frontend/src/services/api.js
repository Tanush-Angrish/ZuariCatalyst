/**
 * api.js
 * Centralized API service for the frontend.
 * Uses fetch with a wrapper to handle baseURL and common logic.
 *
 * For AWS hosting, VITE_API_URL should be set at BUILD TIME securely via your CI/CD,
 * e.g., to "http://<ec2-ip>:5000". If empty, it assumes the API is served on the same domain.
 */

// Default to localhost:5000 for local development if no VITE_API_URL is provided
const DEFAULT_API_URL = '';
const BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
console.log("Loaded API Base URL:", BASE_URL);

async function request(endpoint, options = {}) {
  // Always prepend BASE_URL to the endpoint so that static AWS builds can route requests to your EC2 backend
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const headers = { ...options.headers };
  // If we're sending FormData, don't set Content-Type manually (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
    // DO NOT set any Content-Type header for FormData, the browser must set it with the boundary
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Helper to resolve relative backend URLs (like /uploads/...) to absolute ones
  getFileUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  },
  // Auth
  login: (credentials) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  msLogin: (data) => request('/api/auth/ms-login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Ideas
  // Ideas
  getIdeas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/ideas${qs ? '?' + qs : ''}`);
  },
  getPendingIdeas: () => request('/api/ideas/pending'),
  getCentralAssigned: () => request('/api/ideas/central/assigned'),
  getCentralApproved: () => request('/api/ideas/central/approved'),
  getAssignedIdeas: (userId) => request(`/api/ideas/assigned/${userId}`),
  getMyIdeas: (userId) => request(`/api/ideas/my-ideas/${userId}`),
  getOrgIdeas: (orgName) => request(`/api/ideas/team/${encodeURIComponent(orgName)}`),
  getOrgAdmins: () => request('/api/ideas/orgadmins'),
  getInnovationProjects: () => request('/api/ideas/projects'), // For community feed
  submitIdea: (payload) => request('/api/ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateIdeaStatus: (id, status) => request(`/api/ideas/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  assignIdea: (id, assignedToId) => request(`/api/ideas/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ assignedToId }),
  }),
  autofillIdea: (description, fields) => request('/api/ideas/autofill', {
    method: 'POST',
    body: JSON.stringify({ description, fields }),
  }),

  // Projects
  getProjects: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/projects${qs ? '?' + qs : ''}`);
  },
  getProjectDetails: (id) => request(`/api/projects/${id}`),
  updateProjectStatus: (id, status) => request(`/api/projects/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  updateProjectDeadline: (id, deadline) => request(`/api/projects/${id}/deadline`, {
    method: 'PUT',
    body: JSON.stringify({ deadline }),
  }),
  getProjectParticipants: (id) => request(`/api/projects/${id}/participants`),

  // Project Steps
  addProjectStep: (id, step) => request(`/api/projects/${id}/steps`, {
    method: 'POST',
    body: JSON.stringify(step),
  }),
  updateProjectStep: (id, stepId, data) => request(`/api/projects/${id}/steps/${stepId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProjectStep: (id, stepId) => request(`/api/projects/${id}/steps/${stepId}`, {
    method: 'DELETE',
  }),
  bulkAddSteps: (id, steps) => request(`/api/projects/${id}/steps/bulk`, {
    method: 'POST',
    body: JSON.stringify({ steps }),
  }),
  generateGeminiPlan: (id, data) => request(`/api/projects/${id}/gemini-plan`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Project Chat
  sendProjectMessage: (id, payload) => request(`/api/projects/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Templates & Fields
  getTemplates: () => request('/api/templates'),
  createTemplate: (data) => request('/api/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTemplate: (id, data) => request(`/api/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTemplate: (id) => request(`/api/templates/${id}`, {
    method: 'DELETE',
  }),
  saveFieldOrder: (id, fieldOrder) => request(`/api/templates/${id}/field-order`, {
    method: 'PUT',
    body: JSON.stringify({ fieldOrder }),
  }),
  getTemplateAccess: () => request('/api/templates/access'),
  getOrganizations: () => request('/api/templates/organizations'),
  updateTemplateAccess: (payload) => request('/api/templates/access', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getFormFields: (type) => request(`/api/form-fields/${type}`),
  createFormField: (payload) => request('/api/form-fields', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateFormField: (id, payload) => request(`/api/form-fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteFormField: (id) => request(`/api/form-fields/${id}`, {
    method: 'DELETE',
  }),
  reorderFormFields: (type, fieldOrder) => request(`/api/form-fields/reorder/${type}`, {
    method: 'PUT',
    body: JSON.stringify({ fieldOrder }),
  }),
  getUserFields: () => request('/api/form-fields/user'),

  // Users
  getUsers: () => request('/api/users'),
  createUser: (userData) => request('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  bulkCreateUsers: (users) => request('/api/users/bulk', {
    method: 'POST',
    body: JSON.stringify({ users }),
  }),
  updateUserRole: (id, role) => request(`/api/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
  deleteUser: (id) => request(`/api/users/${id}`, {
    method: 'DELETE',
  }),

  // Notifications
  getNotifications: (userId) => request(`/api/notifications/${userId}`),
  markAllNotificationsRead: (userId) => request(`/api/notifications/user/${userId}/read-all`, {
    method: 'PUT',
  }),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, {
    method: 'PUT',
  }),
  deleteNotification: (id) => request(`/api/notifications/${id}`, {
    method: 'DELETE',
  }),
  clearAllNotifications: (userId) => request(`/api/notifications/user/${userId}`, {
    method: 'DELETE',
  }),

  // Uploads
  uploadFile: (formData) => request('/api/upload/file', {
    method: 'POST',
    body: formData,
  }),
  uploadVoice: (formData) => request('/api/upload/voice', {
    method: 'POST',
    body: formData,
  }),

  // Upvotes
  toggleUpvote: (ideaId, userId) => request(`/api/ideas/${ideaId}/upvote`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  getUpvotes: (ideaId, userId) => request(`/api/ideas/${ideaId}/upvotes?userId=${userId}`),

  // Points & Leaderboard
  getLeaderboard: () => request('/api/points/leaderboard'),
  getUserPoints: (userId) => request(`/api/points/user/${userId}`),

  // AI Template Generation
  generateTemplate: (prompt) => request('/api/templates/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }),

  // Template Categories
  getCategories: () => request('/api/templates/categories'),
  createCategory: (name) => request('/api/templates/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  updateCategory: (id, name) => request(`/api/templates/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  deleteCategory: (id) => request(`/api/templates/categories/${id}`, {
    method: 'DELETE',
  }),

};
