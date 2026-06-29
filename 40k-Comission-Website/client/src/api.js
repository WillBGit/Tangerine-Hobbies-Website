import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const userToken = sessionStorage.getItem('userToken');
  const adminToken = sessionStorage.getItem('adminToken');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
