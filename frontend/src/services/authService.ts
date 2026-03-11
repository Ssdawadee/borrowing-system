import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth';

const authService = {
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  }
};

export default authService;