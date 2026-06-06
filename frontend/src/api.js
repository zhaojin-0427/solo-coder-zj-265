import axios from 'axios';

const API_BASE = 'http://localhost:9203';

export const api = {
  getCakes: (params) => axios.get(`${API_BASE}/api/cakes`, { params }),
  getCake: (id) => axios.get(`${API_BASE}/api/cakes/${id}`),
  getCategories: () => axios.get(`${API_BASE}/api/categories`),
  getOrders: (params) => axios.get(`${API_BASE}/api/orders`, { params }),
  getOrder: (id) => axios.get(`${API_BASE}/api/orders/${id}`),
  createOrder: (data) => axios.post(`${API_BASE}/api/orders`, data),
  updateOrderStatus: (id, status) => axios.put(`${API_BASE}/api/orders/${id}/status`, { status }),
  updateProductionPlan: (id, plan) => axios.put(`${API_BASE}/api/orders/${id}/production-plan`, plan),
  uploadProductPhoto: (id, formData) => axios.post(`${API_BASE}/api/orders/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDeliveryStatus: (id, data) => axios.put(`${API_BASE}/api/orders/${id}/delivery-status`, data),
  completeOrder: (id) => axios.put(`${API_BASE}/api/orders/${id}/complete`),
  getProductionBoard: () => axios.get(`${API_BASE}/api/production-board`),
  getStats: () => axios.get(`${API_BASE}/api/stats`),
  getNotifications: () => axios.get(`${API_BASE}/api/notifications`),
  markNotificationRead: (id) => axios.put(`${API_BASE}/api/notifications/${id}/read`),
  markAllNotificationsRead: () => axios.put(`${API_BASE}/api/notifications/read-all`),
  getSweetnessLevels: () => axios.get(`${API_BASE}/api/sweetness-levels`),
  getOrderStatuses: () => axios.get(`${API_BASE}/api/order-statuses`)
};
