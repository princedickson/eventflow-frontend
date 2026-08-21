import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// This runs before EVERY outgoing request. Instead of manually attaching
// "Authorization: Bearer <token>" in every single API call across the app,
// we do it once here — if a token exists in localStorage, every request
// automatically carries it.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
