/**
 * api.js
 * Centralized API service for the frontend.
 * Uses fetch with a wrapper to handle baseURL and common logic.
 *
 * For AWS hosting, VITE_API_URL should be set at BUILD TIME securely via your CI/CD,
 * e.g., to "http://<ec2-ip>:5000". If empty, it assumes the API is served on the same domain.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  // Always prepend BASE_URL to the endpoint so that static AWS builds can route requests to your EC2 backend
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };
  // If we're sending FormData, don't set Content-Type manually (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
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
  getIdeas: () => request('/api/ideas'),
  getPendingIdeas: () => request('/api/ideas/pending'),
  getAssignedIdeas: (userId) => request(`/api/ideas/assigned/${userId}`),
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
  getProjects: () => request('/api/ideas/projects'),
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
  getTemplateAccess: () => request('/api/templates/access'),
  getOrganizations: () => request('/api/templates/organizations'),
  updateTemplateAccess: (payload) => request('/api/templates/access', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getFormFields: () => request('/api/form-fields'),
  saveFormFields: (fields) => request('/api/form-fields', {
    method: 'POST',
    body: JSON.stringify({ fields }),
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

  // Notifications
  getNotifications: (userId) => request(`/api/notifications/${userId}`),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllNotificationsRead: (userId) => request(`/api/notifications/user/${userId}/read-all`, {
    method: 'PUT',
  }),
  deleteNotification: (id) => request(`/api/notifications/${id}`, {
    method: 'DELETE',
  }),
  clearNotifications: (userId) => request(`/api/notifications/user/${userId}`, {
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
};
