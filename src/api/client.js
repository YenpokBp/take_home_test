import axios from 'axios';

/**
 * Axios instance untuk komunikasi ke backend.
 * Karena Vite proxy meneruskan /api/* ke localhost:5000,
 * cookie otomatis dikirim (same-origin dari sisi browser).
 */
const client = axios.create({
  baseURL: '/api',
});

export default client;
