import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
