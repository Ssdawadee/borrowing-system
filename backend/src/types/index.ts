export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
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
  status: BorrowRequestStatus;
  requestDate: Date;
  returnDate?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum BorrowRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}