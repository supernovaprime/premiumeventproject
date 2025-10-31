import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          // Update tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update axios default header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Retry original request
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          
          // Only show error if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token, redirect to login
        if (!window.location.pathname.includes('/login')) {
          toast.error('Please login to continue');
          window.location.href = '/login';
        }
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network.');
    }

    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Register
  register: (userData) => api.post('/auth/register', userData),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Get current user
  getMe: () => api.get('/auth/me'),
  
  // Update profile
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  // Change password
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  
  // Verify email
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  
  // Verify phone
  verifyPhone: (code) => api.post('/auth/verify-phone', { code }),
  
  // Resend verification
  resendVerification: () => api.post('/auth/resend-verification'),
  
  // Refresh token
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken })
};

// Events API methods
export const eventsAPI = {
  // Get all events
  getEvents: (params) => api.get('/events', { params }),
  
  // Get event by ID
  getEventById: (id) => api.get(`/events/${id}`),
  
  // Get event by slug
  getEventBySlug: (slug) => api.get(`/events/slug/${slug}`),
  
  // Get upcoming events
  getUpcomingEvents: (limit = 10) => api.get('/events/upcoming', { params: { limit } }),
  
  // Get events by organizer
  getEventsByOrganizer: (organizerId, params) => api.get(`/events/organizer/${organizerId}`, { params }),
  
  // Create event
  createEvent: (eventData) => api.post('/events', eventData),
  
  // Update event
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  
  // Delete event
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  // Approve event (Admin)
  approveEvent: (id, adminNotes) => api.put(`/events/${id}/approve`, { adminNotes }),
  
  // Reject event (Admin)
  rejectEvent: (id, rejectionReason, adminNotes) => api.put(`/events/${id}/reject`, { rejectionReason, adminNotes }),
  
  // Get event analytics
  getEventAnalytics: (id) => api.get(`/events/${id}/analytics`)
};

// Users API methods
export const usersAPI = {
  // Get all users (Admin)
  getUsers: (params) => api.get('/users', { params }),
  
  // Get user by ID
  getUserById: (id) => api.get(`/users/${id}`),
  
  // Get user statistics (Admin)
  getUserStats: () => api.get('/users/stats'),
  
  // Search users
  searchUsers: (params) => api.get('/users/search', { params }),
  
  // Get users by role
  getUsersByRole: (role, params) => api.get(`/users/role/${role}`, { params }),
  
  // Update user status (Admin)
  updateUserStatus: (id, status, reason) => api.put(`/users/${id}/status`, { status, reason }),
  
  // Update user role (Admin)
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  
  // Delete user (Admin)
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Categories API methods
export const categoriesAPI = {
  // Get categories by event
  getCategoriesByEvent: (eventId) => api.get(`/categories/event/${eventId}`),
  
  // Get category by ID
  getCategoryById: (id) => api.get(`/categories/${id}`),
  
  // Create category
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  // Update category
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Delete category
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Get category results
  getCategoryResults: (id) => api.get(`/categories/${id}/results`)
};

// Nominees API methods
export const nomineesAPI = {
  // Get nominees by category
  getNomineesByCategory: (categoryId) => api.get(`/nominees/category/${categoryId}`),
  
  // Get nominee by ID
  getNomineeById: (id) => api.get(`/nominees/${id}`),
  
  // Create nominee
  createNominee: (nomineeData) => api.post('/nominees', nomineeData),
  
  // Update nominee
  updateNominee: (id, nomineeData) => api.put(`/nominees/${id}`, nomineeData),
  
  // Delete nominee
  deleteNominee: (id) => api.delete(`/nominees/${id}`),
  
  // Approve nominee
  approveNominee: (id) => api.put(`/nominees/${id}/approve`),
  
  // Reject nominee
  rejectNominee: (id, reason) => api.put(`/nominees/${id}/reject`, { reason })
};

// Votes API methods
export const votesAPI = {
  // Cast vote
  castVote: (voteData) => api.post('/votes', voteData),
  
  // Get votes by event
  getVotesByEvent: (eventId) => api.get(`/votes/event/${eventId}`),
  
  // Get votes by user
  getVotesByUser: (userId) => api.get(`/votes/user/${userId}`),
  
  // Get voting statistics
  getVotingStats: (eventId) => api.get(`/votes/stats/${eventId}`)
};

// Tickets API methods
export const ticketsAPI = {
  // Purchase ticket
  purchaseTicket: (ticketData) => api.post('/tickets/purchase', ticketData),
  
  // Get ticket by ID
  getTicketById: (id) => api.get(`/tickets/${id}`),
  
  // Get tickets by user
  getTicketsByUser: (params) => api.get('/tickets/user', { params }),
  
  // Validate ticket
  validateTicket: (id, validationData) => api.post(`/tickets/${id}/validate`, validationData),
  
  // Get ticket statistics
  getTicketStats: (eventId) => api.get(`/tickets/stats/${eventId}`)
};

// Shop API methods
export const shopAPI = {
  // Get all products
  getProducts: (params) => api.get('/shop/products', { params }),
  
  // Get product by ID
  getProductById: (id) => api.get(`/shop/products/${id}`),
  
  // Search products
  searchProducts: (query, params) => api.get('/shop/products/search', { params: { q: query, ...params } }),
  
  // Create order
  createOrder: (orderData) => api.post('/shop/orders', orderData),
  
  // Get order by ID
  getOrderById: (id) => api.get(`/shop/orders/${id}`),
  
  // Get orders by user
  getOrdersByUser: (params) => api.get('/shop/orders/user', { params }),
  
  // Update order status
  updateOrderStatus: (id, status, notes) => api.put(`/shop/orders/${id}/status`, { status, notes })
};

// Affiliates API methods
export const affiliatesAPI = {
  // Register as affiliate
  registerAffiliate: (affiliateData) => api.post('/affiliates/register', affiliateData),
  
  // Get affiliate stats
  getAffiliateStats: () => api.get('/affiliates/stats'),
  
  // Get affiliate referrals
  getAffiliateReferrals: (params) => api.get('/affiliates/referrals', { params }),
  
  // Get affiliate earnings
  getAffiliateEarnings: (params) => api.get('/affiliates/earnings', { params }),
  
  // Request payout
  requestPayout: (amount) => api.post('/affiliates/payout', { amount }),
  
  // Get payout history
  getPayoutHistory: (params) => api.get('/affiliates/payouts', { params })
};

// Payments API methods
export const paymentsAPI = {
  // Process payment
  processPayment: (paymentData) => api.post('/payments/process', paymentData),
  
  // Get payment by ID
  getPaymentById: (id) => api.get(`/payments/${id}`),
  
  // Get payments by user
  getPaymentsByUser: (params) => api.get('/payments/user', { params }),
  
  // Refund payment
  refundPayment: (id, amount, reason) => api.post(`/payments/${id}/refund`, { amount, reason })
};

// Notifications API methods
export const notificationsAPI = {
  // Get notifications
  getNotifications: (params) => api.get('/notifications', { params }),
  
  // Mark notification as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Delete notification
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// File upload helper
export const uploadFile = async (file, type = 'image') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export default api;
