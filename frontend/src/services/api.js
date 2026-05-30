import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem('hw_factory_lang');
  if (lang) config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getProfile = () => api.get('/auth/profile');

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Master
export const getDesigns = () => api.get('/designs');
export const createDesign = (data) => api.post('/designs', data);
export const updateDesign = (id, data) => api.put(`/designs/${id}`, data);
export const deleteDesign = (id) => api.delete(`/designs/${id}`);

export const getColors = () => api.get('/colors');
export const createColor = (data) => api.post('/colors', data);
export const updateColor = (id, data) => api.put(`/colors/${id}`, data);
export const deleteColor = (id) => api.delete(`/colors/${id}`);

export const getSizes = () => api.get('/sizes');
export const createSize = (data) => api.post('/sizes', data);
export const updateSize = (id, data) => api.put(`/sizes/${id}`, data);
export const deleteSize = (id) => api.delete(`/sizes/${id}`);

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// Inventory
export const getInventory = (params) => api.get('/inventory', { params });
export const createInventory = (data) => api.post('/inventory', data);
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);
export const addStock = (id, quantity) => api.post(`/inventory/${id}/add-stock`, { quantity });

// Customers
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const addPayment = (id, data) => api.post(`/customers/${id}/payments`, data);

// Invoices
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);

// Employee Salaries
export const getSalaries = (params) => api.get('/salaries', { params });
export const getSalary = (id) => api.get(`/salaries/${id}`);
export const createSalary = (data) => api.post('/salaries', data);
export const updateSalary = (id, data) => api.put(`/salaries/${id}`, data);
export const deleteSalary = (id) => api.delete(`/salaries/${id}`);
export const createMonthlySalary = (employeeId, data) => api.post(`/salaries/${employeeId}/monthly`, data);
export const updateMonthlySalary = (employeeId, recordId, data) =>
  api.put(`/salaries/${employeeId}/monthly/${recordId}`, data);
export const deleteMonthlySalary = (employeeId, recordId) =>
  api.delete(`/salaries/${employeeId}/monthly/${recordId}`);

// Roznamcha
export const getRoznamcha = (params) => api.get('/roznamcha', { params });
export const createRoznamcha = (data) => api.post('/roznamcha', data);
export const deleteRoznamcha = (id) => api.delete(`/roznamcha/${id}`);
export const getMonthlyRoznamcha = () => api.get('/roznamcha/monthly');

// Reports
export const getDailySales = (params) => api.get('/reports/daily-sales', { params });
export const getMonthlySales = (params) => api.get('/reports/monthly-sales', { params });
export const getProfitReport = (params) => api.get('/reports/profit', { params });
export const getStockReport = () => api.get('/reports/stock');
export const getCustomerBalances = () => api.get('/reports/customer-balances');
export const getBestSelling = (params) => api.get('/reports/best-selling', { params });

export const exportReport = (type) =>
  api.get(`/reports/export/${type}`, { responseType: 'blob' });

// Backup
export const getBackupStatus = () => api.get('/backup/status');
export const createBackup = () => api.post('/backup');
export const listBackups = () => api.get('/backup');
export const restoreBackup = (filename) => api.post('/backup/restore', { filename });
