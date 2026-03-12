export type UserRole = 'admin' | 'user';
export type BorrowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURN_PENDING' | 'RETURNED';
export type EquipmentStatus = 'NORMAL' | 'DAMAGED';

export interface AppUser {
  id: number;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface Session {
  token: string;
  user: AppUser;
}

export interface EquipmentItem {
  id: number;
  name: string;
  category: string;
  description: string;
  total_quantity: number;
  available_quantity: number;
  damaged_quantity: number;
  image_url: string;
  status: EquipmentStatus;
}

export interface CategoryItem {
  id: number;
  name: string;
}

export interface BorrowRecord {
  id: number;
  user_id: number;
  equipment_id: number;
  quantity?: number;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  return_confirmed_at?: string | null;
  admin_action_at?: string | null;
  borrow_reason?: string | null;
  status: BorrowStatus;
  equipment_name?: string;
  category?: string;
  equipment_available_quantity?: number;
  equipment_total_quantity?: number;
  image_url?: string;
  user_name?: string;
  student_id?: string;
  email?: string;
  due_soon?: number;
}

export interface UserDashboardResponse {
  stats: {
    borrowedCount: number;
    pendingCount: number;
    availableEquipment: number;
  };
  reminders: Array<{
    id: number;
    equipment_name: string;
    due_date: string;
    reminder_type?: 'ONE_DAY_BEFORE' | 'DUE_TODAY' | 'OVERDUE' | 'NONE';
  }>;
  recentBorrows: Array<{
    id: number;
    status: BorrowStatus;
    borrow_date: string;
    due_date: string;
    equipment_name: string;
  }>;
}

export interface AdminDashboardResponse {
  stats: {
    totalEquipment: number;
    availableUnits: number;
    pendingRequests: number;
    damagedItems: number;
    totalUsers: number;
  };
  pendingRequests: Array<{
    id: number;
    status: BorrowStatus;
    borrow_date: string;
    due_date: string;
    borrow_reason?: string | null;
    user_name: string;
    student_id?: string;
    equipment_name: string;
  }>;
}

export interface AdminUserSummary {
  id: number;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
  borrow_count: number;
  latest_borrow_date?: string | null;
  has_unreturned: number;
  has_overdue: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
