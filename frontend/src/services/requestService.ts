import axios from 'axios';
import { API_BASE_URL } from './api';

const requestService = {
  // Create a new borrow request
  createBorrowRequest: async (requestData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/borrow-requests`, requestData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get all borrow requests for a user
  getMyRequests: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/borrow-requests/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get details of a specific borrow request
  getRequestDetails: async (requestId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/borrow-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Update a borrow request
  updateBorrowRequest: async (requestId, updatedData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/borrow-requests/${requestId}`, updatedData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Delete a borrow request
  deleteBorrowRequest: async (requestId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/borrow-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
};

export default requestService;