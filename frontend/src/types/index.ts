export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface BorrowRequest {
  id: string;
  userId: string;
  equipmentId: string;
  status: 'pending' | 'approved' | 'rejected';
  borrowDate: string;
  returnDate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}