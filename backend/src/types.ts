export type UserRole = 'admin' | 'user';

export type BorrowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURN_PENDING' | 'RETURNED';

export type EquipmentCondition = 'NORMAL' | 'DAMAGED';

export interface AuthenticatedUser {
  id: number;
  student_id: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}
