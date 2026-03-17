import { ChevronDown, ChevronUp, ClipboardList, Bell, Info, Box as BoxIcon, History } from 'lucide-react';
// การ์ดกติกาการยืม (ภาษาไทย) - 3 คอลัมน์ ไม่มีปุ่มอ่านเพิ่มเติม
const BorrowingRulesCard: React.FC = () => {
  return (
    <div className="w-full my-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 transition-all w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* ซ้าย: การยืมอุปกรณ์ */}
          <div className="flex-1 flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Info className="w-5 h-5 text-blue-500" />
              การยืมอุปกรณ์
            </div>
            <ul className="ml-1 mt-1 text-sm text-gray-700 space-y-1">
              <li>ยืมได้สูงสุด 5 วัน</li>
              <li>สูงสุด 3 ชิ้น/ชนิดต่อครั้ง</li>
              <li>จองล่วงหน้าได้ 7 วัน</li>
            </ul>
          </div>
          {/* กลาง: การแจ้งเตือน */}
          <div className="flex-1 flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Bell className="w-5 h-5 text-yellow-500" />
              การแจ้งเตือน
            </div>
            <ul className="ml-1 mt-1 text-sm text-gray-700 space-y-1">
              <li>แจ้งเตือนก่อนครบกำหนด 1 วัน</li>
              <li>แจ้งเตือนวันครบกำหนด</li>
              <li>แจ้งเตือนเมื่อเกินกำหนด</li>
            </ul>
          </div>
          {/* ขวา: เงื่อนไขเพิ่มเติม */}
          <div className="flex-1 flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <ClipboardList className="w-5 h-5 text-green-600" />
              เงื่อนไขเพิ่มเติม
            </div>
            <ul className="ml-1 mt-1 text-sm text-gray-700 space-y-1">
              <li>ต้องยืนยันการคืนในระบบทุกครั้ง</li>
              <li>ระบบจะระบุสถานะ <span className="font-semibold text-red-600">"เกินกำหนดคืน"</span> ให้อัตโนมัติเมื่อเลยกำหนด</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, {
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AppLayout from './runtime/components/AppLayout';
import StatCard from './runtime/components/StatCard';
import {
  Users,
  BarChart,
  Clock,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Undo2,
  Receipt,
  CircleDot,
  Search,
  XCircle,
  Inbox,
  PackageCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { clearSession, getRoleHomePath, getStoredSession, saveSession } from './runtime/lib/auth';
import { api, getErrorMessage } from './runtime/lib/api';
import {
  AdminUserSummary,
  AdminDashboardResponse,
  BorrowRecord,
  CategoryItem,
  EquipmentItem,
  PaginationInfo,
  PaginatedResponse,
  Session,
  UserDashboardResponse,
  UserRole,
} from './runtime/types';

interface AuthFormState {
  student_id: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface BorrowRequestFormState {
  borrowDate: string;
  dueDate: string;
  reason: string;
  quantity: number;
}

const initialAuthForm: AuthFormState = {
  student_id: '',
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const initialBorrowForm: BorrowRequestFormState = {
  borrowDate: '',
  dueDate: '',
  reason: '',
  quantity: 1,
};

const getBorrowQuantityLimit = (availableQuantity: number) => Math.max(1, Math.min(3, availableQuantity));
const isValidPhone = (value: string) => /^\d{10}$/.test(value.trim());

const defaultCategoryValues = ['Audio', 'Computing', 'Media', 'Presentation'];
const defaultCategoryItems: CategoryItem[] = defaultCategoryValues.map((name: string, index: number) => ({ id: index + 1, name }));

const categoryLabels: Record<string, string> = {
  All: 'ทั้งหมด',
  Audio: 'เครื่องเสียง',
  Computing: 'คอมพิวเตอร์',
  Media: 'สื่อและภาพถ่าย',
  Presentation: 'งานนำเสนอ',
};

const statusLabels = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธแล้ว',
  RETURN_PENDING: 'รอยืนยันการคืน',
  RETURNED: 'คืนแล้ว',
  NORMAL: 'ปกติ',
  DAMAGED: 'ชำรุด',
} as const;

const roleAccessLabels = {
  admin: 'เข้าสู่ระบบผู้ดูแล',
  user: 'เข้าสู่ระบบนักศึกษา',
} as const;

const TH_TIME_ZONE = 'Asia/Bangkok';

const getCategoryLabel = (category: string) => categoryLabels[category] || category;

const parseApiDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = hasExplicitZone
    ? trimmed
    : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)
      ? `${trimmed.replace(' ', 'T')}Z`
      : trimmed;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateDMY = (value?: string | null) => {
  const date = parseApiDate(value);
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TH_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatTimeHM = (value?: string | null) => {
  const date = parseApiDate(value);
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TH_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const buildBorrowRequestOrderLookup = (records: BorrowRecord[]) => {
  const ordered = [...records].sort((a, b) => {
    const aTime = parseApiDate(a.borrow_date)?.getTime() || 0;
    const bTime = parseApiDate(b.borrow_date)?.getTime() || 0;

    if (aTime === bTime) {
      return a.id - b.id;
    }

    return aTime - bTime;
  });

  return ordered.reduce<Record<number, number>>((accumulator: Record<number, number>, record: BorrowRecord, index: number) => {
    accumulator[record.id] = index + 1;
    return accumulator;
  }, {});
};

const parseBorrowDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const rawYear = Number(slashMatch[3]);
    const year = rawYear > 2400 ? rawYear - 543 : rawYear;

    if (month < 1 || month > 12) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  return null;
};

const toApiDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusLabel = (status: string) => statusLabels[status as keyof typeof statusLabels] || status;

import type { FC } from 'react';
const getStatusIcon = (status: string): ReturnType<FC<{ className?: string }>> => {
  if (status === 'PENDING') {
    return <Clock className="w-4 h-4 inline align-middle mr-1" />;
  }
  if (status === 'APPROVED') {
    return <CheckCircle className="w-4 h-4 inline align-middle mr-1" />;
  }
  if (status === 'REJECTED') {
    return <XCircle className="w-4 h-4 inline align-middle mr-1" />;
  }
  if (status === 'RETURN_PENDING') {
    return <Inbox className="w-4 h-4 inline align-middle mr-1" />;
  }
  if (status === 'RETURNED') {
    return <PackageCheck className="w-4 h-4 inline align-middle mr-1" />;
  }
  if (status === 'DAMAGED') {
    return <AlertTriangle className="w-4 h-4 inline align-middle mr-1" />;
  }
  return <CircleDot className="w-3 h-3 inline align-middle mr-1" />;
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'APPROVED' || status === 'RETURNED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-100 text-rose-700';
  }

  if (status === 'RETURN_PENDING') {
    return 'bg-sky-100 text-sky-700';
  }

  return 'bg-stone-200 text-stone-700';
};

const isValidStudentId = (value: string) => /^b\d{10}$/i.test(value.trim());

const replayAlertMessage = (setter: (value: string) => void, message: string) => {
  setter('');
  window.setTimeout(() => {
    setter(message);
  }, 0);
};

const FloatingAlerts = ({
  error,
  success,
  onClearError,
  onClearSuccess,
}: {
  error?: string;
  success?: string;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}) => {
  const [isErrorVisible, setIsErrorVisible] = useState(Boolean(error));
  const [isSuccessVisible, setIsSuccessVisible] = useState(Boolean(success));

  useEffect(() => {
    setIsErrorVisible(Boolean(error));
  }, [error]);

  useEffect(() => {
    setIsSuccessVisible(Boolean(success));
  }, [success]);

  useEffect(() => {
    if (!error || !isErrorVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsErrorVisible(false);
      onClearError?.();
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [error, isErrorVisible, onClearError]);

  useEffect(() => {
    if (!success || !isSuccessVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSuccessVisible(false);
      onClearSuccess?.();
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [success, isSuccessVisible, onClearSuccess]);

  const alerts = [
    success && isSuccessVisible ? { key: 'success', message: success, variant: 'success' as const } : null,
    error && isErrorVisible ? { key: 'error', message: error, variant: 'error' as const } : null,
  ].filter((item): item is { key: string; message: string; variant: 'success' | 'error' } => Boolean(item));

  if (!alerts.length) {
    return null;
  }

  // Icon mapping
  const iconMap = {
    success: <CheckCircle className="w-5 h-5 mt-0.5 text-emerald-500 flex-shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 mt-0.5 text-rose-500 flex-shrink-0" />,
  };

  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-40 flex -translate-x-1/2 w-auto justify-center">
      <div className="flex flex-col items-center gap-2">
        {alerts.map((alert) => (
          <div
            key={alert.key}
            role="alert"
            className={`rounded-xl border shadow-panel flex items-start gap-2 px-4 py-2 max-w-md w-auto text-sm ${
              alert.variant === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
            style={{ lineHeight: '1.5' }}
          >
            {iconMap[alert.variant]}
            <span className="flex-1 text-left">{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuthShell = ({ children }: { children: ReactNode }) => (
  <div className="campus-hero flex min-h-screen items-center justify-center px-4 py-10">
    <div className="glass-panel w-full max-w-6xl overflow-hidden">
      <div className="grid min-h-[720px] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden bg-gradient-to-br from-cardinal via-brick to-ink p-10 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.45em] text-white/70">สโมสรนิสิตคณะวิศวกรรมศาสตร์</p>
          <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight">
            ระบบยืมอุปกรณ์ของสโมสรนิสิตคณะวิศวกรรมศาสตร์
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/80">
            © 2026 สโมสรนิสิตคณะวิศวกรรมศาสตร์ | ระบบยืมอุปกรณ์
          </p>
        </section>
        <section className="flex items-center justify-center bg-white/75 p-6 sm:p-10">{children}</section>
      </div>
    </div>
  </div>
);

const LoginSelectPage = () => {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">ยินดีต้อนรับ</p>
          <h2 className="mt-3 text-4xl font-semibold text-ink">เลือกประเภทการเข้าใช้งาน</h2>
          <p className="mt-4 text-stone-600">
            เข้าสู่ระบบในฐานะนักศึกษาผู้ยืม หรือผู้ดูแลอุปกรณ์ของชมรม
          </p>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/login?role=user')}
            className="w-full rounded-[24px] bg-cardinal px-6 py-5 text-left text-white shadow-panel transition hover:bg-brick"
          >
            <span className="block text-xs uppercase tracking-[0.3em] text-white/60">นักศึกษา</span>
            <span className="mt-2 block text-2xl font-semibold">เข้าสู่ระบบผู้ยืม</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?role=admin')}
            className="w-full rounded-[24px] border border-cardinal/20 bg-white px-6 py-5 text-left text-ink shadow-panel transition hover:border-cardinal/40"
          >
            <span className="block text-xs uppercase tracking-[0.3em] text-stone-500">ผู้ดูแล</span>
            <span className="mt-2 block text-2xl font-semibold">เข้าสู่ระบบผู้ดูแล</span>
          </button>
        </div>
      </div>
    </AuthShell>
  );
};

const LoginPage = ({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role') === 'admin' ? 'admin' : 'user';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (role === 'user' && !isValidStudentId(identifier)) {
      setError('กรุณากรอกรหัสนักศึกษาให้ขึ้นต้นด้วย b และตามด้วยตัวเลข 10 หลัก');
      setLoading(false);
      return;
    }

    try {
      const payload = role === 'admin'
        ? { email: identifier, password, role }
        : { student_id: identifier, password, role };
      const response = await api.post<Session>('/auth/login', payload);
      saveSession(response.data);
      onAuthenticated(response.data);
      navigate(getRoleHomePath(response.data.user.role));
    } catch (requestError) {
      setError(getErrorMessage(requestError as unknown, 'ไม่สามารถเข้าสู่ระบบได้'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
            {roleAccessLabels[role]}
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-ink">เข้าสู่ระบบ</h2>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">
            {role === 'admin' ? 'อีเมล' : 'รหัสนักศึกษา'}
          </span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-cardinal"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            type={role === 'admin' ? 'email' : 'text'}
            inputMode={role === 'admin' ? 'email' : 'text'}
            pattern={role === 'admin' ? undefined : 'b\\d{10}'}
            maxLength={role === 'admin' ? undefined : 11}
            placeholder={role === 'admin' ? 'กรอกอีเมลผู้ดูแล' : 'เช่น b1234567890'}
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">รหัสผ่าน</span>
          <div className="relative">
            <input
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-cardinal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-0 h-full flex items-center text-lg text-stone-500"
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword
                ? <EyeOff className="w-5 h-5" />
                : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </label>
        <FloatingAlerts error={error} onClearError={() => setError('')} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-cardinal px-4 py-3 font-semibold text-white transition hover:bg-brick disabled:opacity-60"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        {role === 'user' ? (
          <p className="text-center text-sm text-stone-600">
            ยังไม่มีบัญชีนักศึกษา?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-cardinal"
            >
              สมัครสมาชิก
            </button>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cardinal/20 bg-white px-4 py-3 text-sm font-semibold text-cardinal transition hover:border-cardinal/40"
        >
          <span aria-hidden="true">&larr;</span>
          <span>ย้อนกลับไปหน้าเลือกประเภทการเข้าใช้งาน</span>
        </button>
      </form>
    </AuthShell>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<AuthFormState>(initialAuthForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  // Auto-dismiss error like LoginPage
  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(() => {
      setError('');
      setErrorKey((k) => k + 1);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((current: AuthFormState) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isValidStudentId(form.student_id)) {
      setError('');
      setTimeout(() => {
        setError('กรุณากรอกรหัสนักศึกษาให้ขึ้นต้นด้วย b และตามด้วยตัวเลข 10 หลัก');
        setErrorKey((k) => k + 1);
      }, 10);
      return;
    }

    if (!isValidPhone(form.phone)) {
      setError('');
      setTimeout(() => {
        setError('กรุณากรอกเบอร์โทรเป็นตัวเลข 10 หลัก');
        setErrorKey((k) => k + 1);
      }, 10);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('');
      setTimeout(() => {
        setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
        setErrorKey((k) => k + 1);
      }, 10);
      return;
    }

    setLoading(true);

    try {
      await api.post<Session>('/auth/register', {
        student_id: form.student_id,
        name: form.name,
        phone: form.phone,
        password: form.password,
      });
      setSuccessMessage('สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
      setForm(initialAuthForm);
      window.setTimeout(() => {
        navigate('/login?role=user');
      }, 1200);
    } catch (requestError) {
      setError(getErrorMessage(requestError as unknown, 'ไม่สามารถสมัครสมาชิกได้'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">สมัครสมาชิกนักศึกษา</p>
          <h2 className="mt-3 text-4xl font-semibold text-ink">สร้างบัญชีผู้ใช้</h2>
        </div>
        {[
          ['student_id', 'รหัสนักศึกษา'],
          ['name', 'ชื่อ - นามสกุล'],
          ['phone', 'เบอร์โทร'],
          ['password', 'รหัสผ่าน'],
          ['confirmPassword', 'ยืนยันรหัสผ่าน'],
        ].map(([field, label]) => (
          <label className="block space-y-2" key={field}>
            <span className="text-sm font-medium text-stone-700">{label}</span>
            {field === 'password' || field === 'confirmPassword' ? (
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-cardinal"
                  type={
                    field === 'password'
                      ? (showPassword ? 'text' : 'password')
                      : (showConfirmPassword ? 'text' : 'password')
                  }
                  value={form[field as keyof AuthFormState]}
                  onChange={(event) => updateField(field as keyof AuthFormState, event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (field === 'password') {
                      setShowPassword((current) => !current);
                      return;
                    }

                    setShowConfirmPassword((current) => !current);
                  }}
                  className="absolute right-3 top-0 h-full flex items-center text-lg text-stone-500"
                  aria-label={
                    field === 'password'
                      ? (showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน')
                      : (showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน')
                  }
                >
                  {(field === 'password' ? showPassword : showConfirmPassword)
                    ? <EyeOff className="w-5 h-5" />
                    : <Eye className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-cardinal"
                type="text"
                inputMode={field === 'phone' ? 'numeric' : field === 'student_id' ? 'text' : undefined}
                pattern={field === 'student_id' ? 'b\\d{10}' : field === 'phone' ? '\\d{10}' : undefined}
                maxLength={field === 'student_id' ? 11 : field === 'phone' ? 10 : undefined}
                placeholder={field === 'student_id' ? 'เช่น b1234567890' : field === 'phone' ? 'เช่น 0812345678' : undefined}
                value={form[field as keyof AuthFormState]}
                onChange={(event) => updateField(field as keyof AuthFormState, event.target.value)}
                required
              />
            )}
          </label>
        ))}
        <FloatingAlerts key={errorKey} error={error} success={successMessage} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-cardinal px-4 py-3 font-semibold text-white transition hover:bg-brick disabled:opacity-60"
        >
          {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/login?role=user')}
          className="w-full rounded-2xl border border-cardinal/20 bg-white px-4 py-3 text-sm font-semibold text-cardinal transition hover:border-cardinal/40"
        >
          ย้อนกลับไปหน้าเข้าสู่ระบบ
        </button>
      </form>
    </AuthShell>
  );
};

const EquipmentPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(defaultCategoryValues);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [alertKey, setAlertKey] = useState(0);
    useEffect(() => {
      if (!error && !message) return;
      const timeoutId = window.setTimeout(() => {
        setError('');
        setMessage('');
      }, 3000);
      return () => window.clearTimeout(timeoutId);
    }, [error, message]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [borrowForm, setBorrowForm] = useState<BorrowRequestFormState>(initialBorrowForm);
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const fetchEquipment = async () => {
    try {
      const response = await api.get<EquipmentItem[]>('/equipment', {
        params: {
          search: search || undefined,
          category: category === 'All' ? undefined : category,
        },
      });
      setEquipment(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดรายการอุปกรณ์ได้'));
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<CategoryItem[]>('/categories');
      const names = response.data.map((item: CategoryItem) => item.name);
      setCategories(names.length ? names : defaultCategoryValues);
    } catch {
      setCategories(defaultCategoryValues);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [search, category]);

  const openBorrowDialog = (item: EquipmentItem) => {
    const maxQuantity = getBorrowQuantityLimit(item.available_quantity);
    setError('');
    setMessage('');
    setBorrowForm({ ...initialBorrowForm, quantity: Math.min(initialBorrowForm.quantity, maxQuantity) });
    setSelectedEquipment(item);
  };

  const closeBorrowDialog = () => {
    setSelectedEquipment(null);
    setBorrowForm(initialBorrowForm);
  };

  const submitBorrowRequest = async () => {
    setMessage('');
    setError('');

    if (!selectedEquipment) {
      return;
    }

    if (!Number.isInteger(borrowForm.quantity) || borrowForm.quantity < 1) {
      setError('กรุณาระบุจำนวนที่ต้องการยืมอย่างน้อย 1 ชิ้น');
      setAlertKey((k) => k + 1);
      return;
    }

    if (borrowForm.quantity > 3) {
      setError('1 บัญชีสามารถยืมอุปกรณ์ชนิดเดียวกันได้สูงสุด 3 ชิ้นต่อคำขอ');
      setAlertKey((k) => k + 1);
      return;
    }

    if (borrowForm.quantity > selectedEquipment.available_quantity) {
      setError('จำนวนที่ต้องการยืมมากกว่าจำนวนคงเหลือของอุปกรณ์');
      setAlertKey((k) => k + 1);
      return;
    }

    if (!borrowForm.borrowDate || !borrowForm.dueDate || !borrowForm.reason.trim()) {
      setError('กรุณากรอกวันที่ยืม วันที่คืน และเหตุผลในการยืมให้ครบถ้วน');
      setAlertKey((k) => k + 1);
      return;
    }

    const parsedBorrowDate = parseBorrowDateInput(borrowForm.borrowDate);
    const parsedDueDate = parseBorrowDateInput(borrowForm.dueDate);

    if (!parsedBorrowDate || !parsedDueDate) {
      setError('กรุณากรอกวันที่เป็นรูปแบบ วัน/เดือน/ปี เช่น 11/03/2569');
      setAlertKey((k) => k + 1);
      return;
    }

    if (parsedDueDate <= parsedBorrowDate) {
      setError('วันที่คืนต้องมากกว่าวันที่ยืม');
      setAlertKey((k) => k + 1);
      return;
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (parsedBorrowDate < todayMidnight) {
      setError('วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว');
      setAlertKey((k) => k + 1);
      return;
    }

    const maxAdvanceDate = new Date(todayMidnight);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 7);
    if (parsedBorrowDate > maxAdvanceDate) {
      setError('จองอุปกรณ์ล่วงหน้าได้ไม่เกิน 7 วัน');
      setAlertKey((k) => k + 1);
      return;
    }

    const diffDays = (parsedDueDate.getTime() - parsedBorrowDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 5) {
      setError('ระยะเวลายืมต้องไม่เกิน 5 วัน');
      setAlertKey((k) => k + 1);
      return;
    }

    const borrowDateForApi = toApiDateString(parsedBorrowDate);
    const dueDateForApi = toApiDateString(parsedDueDate);

    setSubmissionState('submitting');

    try {
      await api.post('/borrow/request', {
        equipmentId: selectedEquipment.id,
        borrowDate: borrowDateForApi,
        dueDate: dueDateForApi,
        reason: borrowForm.reason,
        quantity: borrowForm.quantity,
      });
      setSubmissionState('success');
      replayAlertMessage(setMessage, 'ส่งคำขอยืมอุปกรณ์เรียบร้อยแล้ว กรุณารอผู้ดูแลอนุมัติ');
      closeBorrowDialog();
      fetchEquipment();
    } catch (requestError) {
      setSubmissionState('idle');
      setError(getErrorMessage(requestError, 'ไม่สามารถส่งคำขอยืมได้'));
      setAlertKey((k) => k + 1);
    }
  };

  if (submissionState !== 'idle') {
    return (
      <AppLayout user={session.user} title="รายการอุปกรณ์" onLogout={onLogout}>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="glass-panel w-full max-w-2xl p-10 text-center">
            {submissionState === 'submitting' ? (
              <>
                <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-cardinal/20 border-t-cardinal" />
                <h3 className="text-3xl font-semibold text-ink">กำลังส่งคำขอยืม</h3>
                <p className="mt-4 text-stone-600">
                  ระบบกำลังบันทึกวันที่ยืม วันคืน และเหตุผลในการยืมของคุณ
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
                  ✓
                </div>
                <h3 className="text-3xl font-semibold text-ink">ส่งคำขอเรียบร้อยแล้ว</h3>
                <p className="mt-4 text-stone-600">คำขอยืมของคุณถูกส่งให้ผู้ดูแลตรวจสอบแล้ว</p>
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionState('idle')}
                    className="rounded-2xl border border-cardinal/20 bg-white px-5 py-3 font-semibold text-cardinal"
                  >
                    กลับไปรายการอุปกรณ์
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.assign('/history')}
                    className="rounded-2xl bg-cardinal px-5 py-3 font-semibold text-white"
                  >
                    ไปที่ประวัติการยืม
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={session.user} title="รายการอุปกรณ์" onLogout={onLogout}>
      <div className="space-y-6">
        <div className="glass-panel p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาอุปกรณ์"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-cardinal"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-cardinal"
            >
              <option value="All">{getCategoryLabel('All')}</option>
              {categories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {getCategoryLabel(categoryName)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FloatingAlerts key={alertKey} error={error} success={message} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {equipment.map((item: EquipmentItem) => (
            <article key={item.id} className="glass-panel overflow-hidden p-0">
              <div className="relative h-52 bg-stone-200">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
                  {getCategoryLabel(item.category)}
                </span>

              </div>
              <div className="space-y-3 p-4">
                <h3 className="text-3xl font-semibold leading-tight text-ink">{item.name}</h3>
                <p className="min-h-[48px] text-sm leading-6 text-stone-600">{item.description}</p>
                <div className="text-sm">
                  <p className="text-stone-500">คงเหลือ</p>
                  <p className="font-semibold text-emerald-600">{item.available_quantity} / {item.total_quantity}</p>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={session.user.role !== 'user' || item.available_quantity < 1}
                    onClick={() => openBorrowDialog(item)}
                    className="w-full rounded-2xl bg-cardinal px-8 py-3 text-lg font-semibold text-white transition hover:bg-brick disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    ยืม
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {selectedEquipment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-8 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-3xl overflow-hidden">
              <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr] lg:p-8">
                <div>
                  <p className="text-sm font-semibold text-cardinal">คำขอยืมอุปกรณ์</p>
                  <div className="mt-4 overflow-hidden rounded-[24px] bg-stone-200">
                    <img src={selectedEquipment.image_url} alt={selectedEquipment.name} className="h-52 w-full object-cover" />
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-ink">{selectedEquipment.name}</h3>
                  <p className="mt-2 text-sm text-stone-500">{selectedEquipment.description}</p>
                  <span className="mt-4 inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-semibold text-white">
                    {getCategoryLabel(selectedEquipment.category)}
                  </span>
                </div>
                <div className="space-y-5">
                  {(() => {
                    const maxQuantity = getBorrowQuantityLimit(selectedEquipment.available_quantity);

                    return (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">วันที่ยืม</span>
                      <input
                        type="date"
                        lang="th-TH"
                        value={borrowForm.borrowDate}
                        onChange={(event) => setBorrowForm((current) => ({ ...current, borrowDate: event.target.value }))}
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-cardinal"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">วันที่คืน</span>
                      <input
                        type="date"
                        lang="th-TH"
                        value={borrowForm.dueDate}
                        onChange={(event) => setBorrowForm((current) => ({ ...current, dueDate: event.target.value }))}
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-cardinal"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">จำนวนที่ต้องการยืม</span>
                      <div className="flex items-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                        <button
                          type="button"
                          onClick={() => {
                            setBorrowForm((current) => ({
                              ...current,
                              quantity: Math.max(1, current.quantity - 1),
                            }));
                          }}
                          disabled={borrowForm.quantity <= 1}
                          className="px-4 py-3 text-xl font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                          aria-label="ลดจำนวนอุปกรณ์"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={borrowForm.quantity}
                          readOnly
                          className="w-full border-x border-stone-200 bg-white px-4 py-3 text-center text-lg font-semibold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBorrowForm((current) => ({
                              ...current,
                              quantity: Math.min(maxQuantity, current.quantity + 1),
                            }));
                          }}
                          disabled={borrowForm.quantity >= maxQuantity}
                          className="px-4 py-3 text-xl font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                          aria-label="เพิ่มจำนวนอุปกรณ์"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-stone-500">ยืมได้สูงสุด 3 ชิ้น/อุปกรณ์</p>
                    </label>
                  </div>
                    );
                  })()}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700">เหตุผลในการยืม</span>
                    <textarea
                      value={borrowForm.reason}
                      onChange={(event) => setBorrowForm((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="โปรดระบุเหตุผลและวัตถุประสงค์ในการยืมอุปกรณ์"
                      className="min-h-36 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-cardinal"
                    />
                  </label>
                  <FloatingAlerts error={error} />
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeBorrowDialog}
                      className="rounded-2xl bg-stone-200 px-5 py-3 font-semibold text-stone-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={submitBorrowRequest}
                      className="rounded-2xl bg-cardinal px-5 py-3 font-semibold text-white"
                    >
                      ส่งคำขอยืม
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

const BorrowHistoryPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  const summary = useMemo(() => {
    const pending = records.filter((record) => record.status === 'PENDING').length;
    const approved = records.filter((record) => record.status === 'APPROVED').length;
    const returnPending = records.filter((record) => record.status === 'RETURN_PENDING').length;
    const returned = records.filter((record) => record.status === 'RETURNED').length;

    return {
      total: records.length,
      pending,
      approved,
      returnPending,
      returned,
    };
  }, [records]);

  const loadHistory = async () => {
    try {
      const response = await api.get<BorrowRecord[]>('/borrow/user');
      setRecords(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดประวัติการยืมได้'));
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const sortedRecords = useMemo(() => {
    const items = [...records];

    const getActivityTime = (record: BorrowRecord) => {
      const source = record.return_date || record.borrow_date;
      const parsed = parseApiDate(source);
      return parsed ? parsed.getTime() : 0;
    };

    items.sort((a, b) => {
      const aTime = getActivityTime(a);
      const bTime = getActivityTime(b);

      if (aTime === bTime) {
        return sortOrder === 'latest' ? b.id - a.id : a.id - b.id;
      }

      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });

    return items;
  }, [records, sortOrder]);

  return (
    <AppLayout user={session.user} title="คำขอยืมของฉัน" onLogout={onLogout}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-4">
            <p className="text-sm text-stone-500">คำขอยืมทั้งหมด</p>
            <p className="mt-2 text-4xl font-semibold text-ink">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm text-amber-700">รอการอนุมัติ</p>
            <p className="mt-2 text-4xl font-semibold text-amber-700">{summary.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-sm text-emerald-700">อนุมัติแล้ว</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-700">{summary.approved}</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
            <p className="text-sm text-sky-700">รอยืนยันการคืน</p>
            <p className="mt-2 text-4xl font-semibold text-sky-700">{summary.returnPending}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-4">
            <p className="text-sm text-stone-700">คืนแล้ว</p>
            <p className="mt-2 text-4xl font-semibold text-stone-700">{summary.returned}</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-ink">ประวัติการยืม</h3>
              <p className="mt-1 text-sm text-stone-500">คำขอยืมทั้งหมดของคุณและสถานะปัจจุบัน</p>
            </div>
            <div className="inline-flex rounded-2xl border border-stone-200 bg-white/90 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setSortOrder('latest')}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  sortOrder === 'latest' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                ล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('oldest')}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  sortOrder === 'oldest' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                เก่าสุด
              </button>
            </div>
          </div>
          <div className="mt-5 table-shell bg-white/80">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>อุปกรณ์</th>
                  <th>เวลายืม</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เวลาส่งคืน</th>
                  <th>เหตุผลในการยืม</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record: BorrowRecord, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="font-semibold text-ink">{record.equipment_name}</div>
                      <div className="text-xs text-stone-500">{getCategoryLabel(record.category || '')}</div>
                    </td>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.due_date)}</td>
                    <td>{formatTimeHM(record.return_date)}</td>
                    <td>
                      <p className="max-w-[340px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                    </td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(record.status)}`}>
                        {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!sortedRecords.length ? (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              ยังไม่มีประวัติการยืม
            </div>
          ) : null}
        </div>
        <FloatingAlerts error={error} />
      </div>
    </AppLayout>
  );
};

const ReturnEquipmentPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadRecords = async () => {
    try {
      const response = await api.get<BorrowRecord[]>('/borrow/user');
      setRecords(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดรายการยืมได้'));
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const requestReturn = async (id: number) => {
    setMessage('');
    setError('');
    setSubmittingId(id);

    try {
      await api.put(`/borrow/return/${id}`);
      replayAlertMessage(setMessage, 'ส่งคำขอคืนอุปกรณ์เรียบร้อยแล้ว กรุณารอผู้ดูแลยืนยัน');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถส่งคำขอคืนได้'));
    } finally {
      setSubmittingId(null);
    }
  };

  const activeBorrows = useMemo(
    () => records.filter((record) => record.status === 'APPROVED'),
    [records]
  );

  const pendingReturns = useMemo(
    () => records.filter((record) => record.status === 'RETURN_PENDING'),
    [records]
  );

  return (
    <AppLayout user={session.user} title="คืนอุปกรณ์" onLogout={onLogout}>
      <div className="space-y-6">
        <FloatingAlerts error={error} success={message} />

        <section className="glass-panel p-6">
          <h3 className="text-2xl font-semibold text-ink">รายการที่ยืมอยู่ในปัจจุบัน</h3>
          <p className="mt-1 text-sm text-stone-500">คลิกปุ่มยืนยันการคืนเพื่อส่งคำขอคืนไปยังผู้ดูแล</p>
          <div className="mt-5 table-shell bg-white/80">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>อุปกรณ์</th>
                  <th>เวลายืม</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เหตุผลในการยืม</th>
                  <th>เวลาส่งคืน</th>
                  <th>สถานะ</th>
                  <th>ยืนยันการคืน</th>
                </tr>
              </thead>
              <tbody>
                {activeBorrows.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.equipment_name}</td>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.due_date)}</td>
                    <td>
                      <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                    </td>
                    <td>{formatTimeHM(record.return_date)}</td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(record.status)}`}>
                        {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => requestReturn(record.id)}
                        disabled={submittingId === record.id}
                        className="rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brick disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        {submittingId === record.id ? 'กำลังส่ง...' : 'ยืนยันการสั่งคืน'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-3">
            {!activeBorrows.length ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                ไม่มีรายการที่อยู่ระหว่างการยืม
              </div>
            ) : null}
          </div>
        </section>

        <section className="glass-panel p-6">
          <h3 className="text-xl font-semibold text-ink">รายการที่รอผู้ดูแลยืนยันการคืน</h3>
          <div className="mt-4 table-shell bg-white/80">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>อุปกรณ์</th>
                  <th>เวลายืม</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เหตุผลในการยืม</th>
                  <th>เวลาส่งคืน</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {pendingReturns.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.equipment_name}</td>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.due_date)}</td>
                    <td>
                      <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                    </td>
                    <td>{formatTimeHM(record.return_date)}</td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(record.status)}`}>
                        {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-3">
            {!pendingReturns.length ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                ยังไม่มีรายการที่รอยืนยันการคืน
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

const UserDashboardPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [data, setData] = useState<UserDashboardResponse | null>(null);
  const [error, setError] = useState('');

  const loadDashboard = () => {
    api
      .get<UserDashboardResponse>('/dashboard/user')
      .then((response: { data: UserDashboardResponse }) => setData(response.data))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError, 'ไม่สามารถโหลดแดชบอร์ดได้')));
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    const handleWindowFocus = () => { loadDashboard(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') { loadDashboard(); }
    };
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AppLayout user={session.user} title="แดชบอร์ดนักศึกษา" onLogout={onLogout}>
      <div className="space-y-6">
        {/* กติกาการยืม (ภาษาไทย) */}
        <BorrowingRulesCard />
        <FloatingAlerts error={error} />
        <div className="grid gap-5 md:grid-cols-3">
          <StatCard label="กำลังยืมอยู่" value={data?.stats.borrowedCount || 0} icon={BookOpen} />
          <StatCard label="ประวัติการยืม" value={data?.stats.pendingCount || 0} accent="from-amber-400 to-orange-500" icon={History} />
          <StatCard label="อุปกรณ์พร้อมยืม" value={data?.stats.availableEquipment || 0} accent="from-emerald-500 to-teal-600" icon={BoxIcon} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-ink">กิจกรรมการยืมล่าสุด</h3>
                <button
                  type="button"
                  onClick={() => window.location.assign('/history')}
                  className="text-sm font-semibold text-cardinal"
                >
                  ดูทั้งหมด
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {data?.recentBorrows.map((record: UserDashboardResponse['recentBorrows'][number]) => (
                  <div key={record.id} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{record.equipment_name}</p>
                        <p className="text-sm text-stone-500">ยืมเมื่อ {formatDateDMY(record.borrow_date)}</p>
                      </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(record.status)}`}>
                        {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-ink">การแจ้งเตือนการคืน</h3>
              <div className="mt-5 space-y-4">
                {data?.reminders.length ? (
                  data.reminders.map((reminder: UserDashboardResponse['reminders'][number]) => (
                    <div key={reminder.id} className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      <p className="font-semibold">{reminder.equipment_name}</p>
                      <p>
                        {reminder.reminder_type === 'ONE_DAY_BEFORE'
                          ? `แจ้งเตือน: เหลือ 1 วันก่อนครบกำหนดคืน (${formatDateDMY(reminder.due_date)})`
                          : reminder.reminder_type === 'DUE_TODAY'
                            ? `แจ้งเตือน: วันนี้ถึงกำหนดคืน (${formatDateDMY(reminder.due_date)})`
                            : reminder.reminder_type === 'OVERDUE'
                              ? `แจ้งเตือน: เกินกำหนดคืนแล้ว (${formatDateDMY(reminder.due_date)})`
                              : `ครบกำหนดคืนวันที่ ${formatDateDMY(reminder.due_date)}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">ยังไม่มีการแจ้งเตือนการคืนอุปกรณ์</p>
                )}
              </div>
            </section>
        </div>
      </div>
    </AppLayout>
  );
};

const AdminDashboardPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');

  // Map pendingRequests to BorrowRecord[] with default values for missing fields
  // Always work with BorrowRecord[]
  const allPendingRecords: BorrowRecord[] = useMemo(() =>
    (data?.pendingRequests || []).map((item) => ({
      id: item.id,
      user_id: 0,
      equipment_id: 0,
      quantity: undefined,
      borrow_date: item.borrow_date,
      due_date: item.due_date,
      return_date: undefined,
      approved_at: undefined,
      rejected_at: undefined,
      return_confirmed_at: undefined,
      admin_action_at: undefined,
      borrow_reason: item.borrow_reason,
      status: item.status,
      equipment_name: item.equipment_name,
      category: undefined,
      equipment_available_quantity: undefined,
      equipment_total_quantity: undefined,
      image_url: undefined,
      user_name: item.user_name,
      student_id: item.student_id,
      email: undefined,
      due_soon: undefined,
    })),
    [data?.pendingRequests]
  );

  const filteredPendingRequests: BorrowRecord[] = useMemo(() => {
    const keyword = requestSearchKeyword.trim().toLowerCase();
    if (!keyword) {
      return allPendingRecords;
    }
    return allPendingRecords.filter((item) =>
      (item.user_name?.toLowerCase() || '').includes(keyword) ||
      (item.student_id || '').toLowerCase().includes(keyword) ||
      (item.equipment_name?.toLowerCase() || '').includes(keyword)
    );
  }, [allPendingRecords, requestSearchKeyword]);

  const sortedPendingRequests = useMemo(() => {
    const items = [...filteredPendingRequests];

    items.sort((a, b) => {
      const aTime = parseApiDate(a.borrow_date)?.getTime() || 0;
      const bTime = parseApiDate(b.borrow_date)?.getTime() || 0;

      if (aTime === bTime) {
        return a.id - b.id;
      }

      return aTime - bTime;
    });

    return items;
  }, [filteredPendingRequests]);

  const requestOrderLookup = useMemo(
    () => buildBorrowRequestOrderLookup(sortedPendingRequests),
    [sortedPendingRequests]
  );

  useEffect(() => {
    api
      .get<AdminDashboardResponse>('/dashboard/admin')
      .then((response: any) => setData(response.data))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError, 'ไม่สามารถโหลดแดชบอร์ดผู้ดูแลได้')));
  }, []);

  return (
    <AppLayout user={session.user} title="แดชบอร์ดผู้ดูแล" onLogout={onLogout}>
      <div className="space-y-6">
        <FloatingAlerts error={error} />
        <div className="grid gap-5 md:grid-cols-5">
          <StatCard label="ผู้ใช้ทั้งหมด" value={data?.stats.totalUsers || 0} accent="from-indigo-500 to-sky-600" icon={Users} />
          <StatCard label="รายการอุปกรณ์" value={data?.stats.totalEquipment || 0} icon={BoxIcon} />
          <StatCard label="จำนวนคงเหลือ" value={data?.stats.availableUnits || 0} accent="from-emerald-500 to-teal-600" icon={BarChart} />
          <StatCard label="คำขอรออนุมัติ" value={data?.stats.pendingRequests || 0} accent="from-amber-400 to-orange-500" icon={Clock} />
          <StatCard label="อุปกรณ์ชำรุด" value={data?.stats.damagedItems || 0} accent="from-slate-500 to-slate-700" icon={AlertTriangle} />
        </div>
        <section className="glass-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-ink">คิวคำขอที่ต้องดำเนินการ</h3>
            <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
              <Search aria-hidden="true" className="w-5 h-5 text-stone-500" />
              <input
                type="text"
                value={requestSearchKeyword}
                onChange={(event) => setRequestSearchKeyword(event.target.value)}
                placeholder="ค้นหาชื่อผู้ยืม รหัสนิสิต หรือ อุปกรณ์..."
                className="w-full border-0 bg-transparent px-0 py-0 text-sm text-stone-700 outline-none placeholder:text-stone-400"
              />
            </label>
          </div>
          <div className="mt-5 table-shell">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>ผู้ยืม</th>
                  <th>อุปกรณ์</th>
                  <th>จำนวนที่ยืม</th>
                  <th>เวลายืม</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เวลาส่งคืน</th>
                  <th>เหตุผลการยืม</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {sortedPendingRequests.map((request: BorrowRecord) => (
                  <tr key={request.id}>
                    <td>{requestOrderLookup[request.id] ?? '-'}</td>
                    <td>
                      <div className="font-semibold text-ink">{request.user_name}</div>
                      <div className="text-xs text-stone-500">{request.student_id}</div>
                    </td>
                    <td>{request.equipment_name}</td>
                    <td>{request.quantity !== undefined ? request.quantity : '-'}</td>
                    <td>{formatTimeHM(request.borrow_date)}</td>
                    <td>{formatDateDMY(request.borrow_date)}</td>
                    <td>{formatDateDMY(request.due_date)}</td>
                    <td>{request.return_date ? formatTimeHM(request.return_date) : '-'}</td>
                    <td>
                      <p className="max-w-[360px] text-sm text-stone-700">{request.borrow_reason || '-'}</p>
                    </td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(request.status)}`}>
                        {getStatusIcon(request.status)} {getStatusLabel(request.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredPendingRequests.length ? (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              ไม่พบข้อมูล
            </div>
          ) : null}
        </section>
      </div>
    </AppLayout>
  );
};

const ManageUsersPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue'>('all');
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const response = await api.get<AdminUserSummary[]>('/admin/users');
      setUsers(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'));
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return users.filter((user) => {
      if (statusFilter === 'overdue' && !user.has_overdue) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        user.name.toLowerCase().includes(keyword) ||
        user.student_id.toLowerCase().includes(keyword) ||
        (user.phone || '').toLowerCase().includes(keyword)
      );
    });
  }, [users, searchKeyword, statusFilter]);

  const removeUser = async (id: number | null) => {
    if (id === null) {
      return;
    }

    setDeletingUserId(id);
    setError('');
    setMessage('');

    try {
      await api.delete(`/admin/users/${id}`);
      replayAlertMessage(setMessage, 'ลบผู้ใช้เรียบร้อยแล้ว');
      await loadUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถลบผู้ใช้ได้'));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <AppLayout user={session.user} title="จัดการผู้ใช้" onLogout={onLogout}>
      <div className="space-y-4">
        <FloatingAlerts error={error} success={message} />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-stone-500">ผู้ใช้ทั้งหมด</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{users.length}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-stone-500">มีของค้างคืน</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{users.filter((user) => user.has_unreturned).length}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-stone-500">เกินกำหนดคืน</p>
            <p className="mt-2 text-3xl font-semibold text-rose-600">{users.filter((user) => user.has_overdue).length}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-stone-200 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                statusFilter === 'all' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                statusFilter === 'overdue' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              เกินกำหนดคืน
            </button>
          </div>
          <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
            <Search aria-hidden="true" className="w-5 h-5 text-stone-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="ค้นหาชื่อ รหัสนิสิต หรือ เบอร์โทร..."
              className="w-full border-0 bg-transparent px-0 py-0 text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500 shadow-sm">
          <span className="font-semibold text-stone-600">คำอธิบายสถานะ:</span>{' '}
          <span>ปกติ = ไม่มีของค้างคืน,</span>{' '}
          <span>มีของค้างคืน = ยังไม่คืนแต่ยังไม่เกินกำหนด,</span>{' '}
          <span>เกินกำหนดคืน = ยังไม่คืนและเลยกำหนดแล้ว,</span>{' '}
          <span>ยังไม่เคยยืม = ยังไม่มีประวัติการยืม</span>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ผู้ใช้</th>
                <th>เบอร์โทร</th>
                <th>วันที่สมัคร</th>
                <th>จำนวนครั้งที่ยืม</th>
                <th>ยืมล่าสุด</th>
                <th>สถานะการยืม</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className={user.has_overdue ? 'bg-rose-50/70' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="font-semibold text-ink">{user.name}</div>
                    <div className="text-xs text-stone-500">{user.student_id}</div>
                  </td>
                  <td>{user.phone || '-'}</td>
                  <td>{formatDateDMY(user.created_at)}</td>
                  <td>{user.borrow_count || 0}</td>
                  <td>{user.latest_borrow_date ? formatDateDMY(user.latest_borrow_date) : '-'}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {user.has_overdue ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">เกินกำหนดคืน</span>
                      ) : null}
                      {!user.has_overdue && user.has_unreturned ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">มีของค้างคืน</span>
                      ) : null}
                      {!user.has_overdue && !user.has_unreturned ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {user.borrow_count > 0 ? 'ปกติ' : 'ยังไม่เคยยืม'}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmUserId(user.id)}
                      disabled={deletingUserId === user.id}
                      className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {deletingUserId === user.id ? 'กำลังลบ...' : 'ลบผู้ใช้'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredUsers.length ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            ไม่พบข้อมูลผู้ใช้
          </div>
        ) : null}
        {deleteConfirmUserId !== null ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-8">
              <h3 className="text-xl font-semibold text-ink">ยืนยันการลบผู้ใช้</h3>
              <p className="mt-3 text-sm text-stone-600">
                คุณต้องการลบ{' '}
                <span className="font-semibold text-ink">{users.find((item) => item.id === deleteConfirmUserId)?.name}</span>{' '}
                ออกจากระบบหรือไม่? การลบไม่สามารถย้อนกลับได้
              </p>
              <p className="mt-2 text-xs text-amber-700">
                หมายเหตุ: ถ้าผู้ใช้นี้มีรายการยืมหรือคืนค้าง ระบบจะไม่อนุญาตให้ลบ
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUserId(null)}
                  className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => { const id = deleteConfirmUserId; setDeleteConfirmUserId(null); removeUser(id); }}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  ลบผู้ใช้
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

const ManageEquipmentPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSubmitEvent, setPendingSubmitEvent] = useState<FormEvent<HTMLFormElement> | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategoryItems);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', total_quantity: 1, damaged_quantity: 0, image_url: '', category: '' });
  const [form, setForm] = useState({
    name: '',
    category: 'Media',
    description: '',
    total_quantity: 1,
    available_quantity: 1,
    damaged_quantity: 0,
    image_url: '',
    status: 'NORMAL',
  });

  const loadEquipment = async () => {
    try {
      const response = await api.get<EquipmentItem[]>('/equipment');
      setEquipment(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้'));
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get<CategoryItem[]>('/categories');
      const items = response.data;
      const names = items.map((item: CategoryItem) => item.name);


      if (names.length) {
        setCategories(items);
        setForm((current) => ({
          ...current,
          category: names.includes(current.category) ? current.category : names[0],
        }));
      } else {
        setCategories(defaultCategoryItems);
      }
    } catch {
      setCategories(defaultCategoryItems);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadCategories();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingSubmitEvent(event);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    setError('');
    setMessage('');
    setShowConfirmModal(false);
    if (!pendingSubmitEvent) return;
    try {
      await api.post('/equipment', {
        ...form,
        total_quantity: Number(form.total_quantity),
        damaged_quantity: Number(form.damaged_quantity),
        available_quantity: Math.max(0, Number(form.total_quantity) - Number(form.damaged_quantity)),
      });
      replayAlertMessage(setMessage, 'เพิ่มอุปกรณ์เรียบร้อยแล้ว');
      setForm({
        name: '',
        category: 'Media',
        description: '',
        total_quantity: 1,
        available_quantity: 1,
        damaged_quantity: 0,
        image_url: '',
        status: 'NORMAL',
      });
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถเพิ่มอุปกรณ์ได้'));
    }
    setPendingSubmitEvent(null);
  };

  const handleCancelAdd = () => {
    setShowConfirmModal(false);
    setPendingSubmitEvent(null);
  };

  const openEdit = (item: EquipmentItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description,
      total_quantity: item.total_quantity,
      damaged_quantity: item.damaged_quantity || 0,
      image_url: item.image_url,
      category: item.category,
    });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setError('');
    setMessage('');
    const total = Math.max(1, Number(editForm.total_quantity));
    const damaged = Math.min(Math.max(0, Number(editForm.damaged_quantity)), total);
    try {
      await api.put(`/equipment/${editingItem.id}`, {
        ...editingItem,
        name: editForm.name,
        description: editForm.description,
        total_quantity: total,
        damaged_quantity: damaged,
        available_quantity: Math.max(0, total - damaged),
        image_url: editForm.image_url,
        category: editForm.category,
      });
      replayAlertMessage(setMessage, 'แก้ไขอุปกรณ์เรียบร้อยแล้ว');
      setEditingItem(null);
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถแก้ไขอุปกรณ์ได้'));
    }
  };

  const removeItem = async (id: number) => {
    setError('');
    setMessage('');

    try {
      await api.delete(`/equipment/${id}`);
      replayAlertMessage(setMessage, 'ลบอุปกรณ์เรียบร้อยแล้ว');
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถลบอุปกรณ์ได้'));
    }
  };

  return (
    <AppLayout user={session.user} title="จัดการอุปกรณ์" onLogout={onLogout}>
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="rounded-2xl bg-white p-6 shadow-xl w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">ยืนยันการเพิ่มอุปกรณ์</h4>
            <p className="mb-6 text-stone-700">คุณต้องการเพิ่มอุปกรณ์นี้ใช่หรือไม่?</p>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelAdd} className="px-4 py-2 rounded-xl bg-stone-200 text-stone-700 font-medium">ยกเลิก</button>
              <button onClick={handleConfirmAdd} className="px-4 py-2 rounded-xl bg-cardinal text-white font-semibold">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
      <FloatingAlerts error={error} success={message} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel p-6">
          <h3 className="text-xl font-semibold text-ink">เพิ่มอุปกรณ์</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="ชื่ออุปกรณ์" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">หมวดหมู่</span>
              <select
                className="w-full rounded-2xl border border-stone-200 px-4 py-3"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              >
                {categories.map((categoryItem) => (
                  <option key={categoryItem.id} value={categoryItem.name}>
                    {getCategoryLabel(categoryItem.name)}
                  </option>
                ))}
              </select>
            </label>
            <textarea className="min-h-28 w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="รายละเอียด" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">จำนวนทั้งหมด (มีอยู่ทั้งหมดกี่ชิ้น)</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3"
                  type="number"
                  min="1"
                  placeholder="เช่น 20"
                  value={form.total_quantity}
                  onChange={(event) => {
                    const nextTotal = Number(event.target.value);
                    const nextDamaged = Math.min(Number(form.damaged_quantity) || 0, Math.max(0, nextTotal));
                    setForm({
                      ...form,
                      total_quantity: nextTotal,
                      damaged_quantity: nextDamaged,
                      available_quantity: Math.max(0, nextTotal - nextDamaged),
                    });
                  }}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">จำนวนชำรุด</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3"
                  type="number"
                  min="0"
                  max={Math.max(0, Number(form.total_quantity) || 0)}
                  placeholder="เช่น 5"
                  value={form.damaged_quantity}
                  onChange={(event) => {
                    const nextDamagedRaw = Number(event.target.value);
                    const safeTotal = Math.max(0, Number(form.total_quantity) || 0);
                    const nextDamaged = Math.min(Math.max(0, nextDamagedRaw), safeTotal);
                    setForm({
                      ...form,
                      damaged_quantity: nextDamaged,
                      available_quantity: Math.max(0, safeTotal - nextDamaged),
                    });
                  }}
                  required
                />
              </label>
              <div className="md:col-span-2">
                <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                  พร้อมใช้: {Math.max(0, Number(form.total_quantity) - Number(form.damaged_quantity))} / {Number(form.total_quantity) || 0} · ชำรุด: {Number(form.damaged_quantity) || 0}
                </div>
              </div>
            </div>
            <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="ลิงก์รูปภาพ" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-cardinal px-4 py-3 font-semibold text-white">บันทึกอุปกรณ์</button>
          </form>
        </section>
        <section className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>หมวดหมู่</th>
                <th>คงเหลือ</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item: EquipmentItem) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-semibold text-ink">{item.name}</div>
                    <div className="text-xs text-stone-500">{item.description}</div>
                  </td>
                  <td>{getCategoryLabel(item.category)}</td>
                  <td>{item.available_quantity}/{item.total_quantity} (ชำรุด {item.damaged_quantity || 0})</td>
                  <td>{item.damaged_quantity > 0 ? 'ชำรุด' : 'ปกติ'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-600"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {deleteConfirmId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-8">
            <h3 className="text-xl font-semibold text-ink">ยืนยันการลบอุปกรณ์</h3>
            <p className="mt-3 text-sm text-stone-600">
              คุณต้องการลบ{' '}
              <span className="font-semibold text-ink">{equipment.find((item) => item.id === deleteConfirmId)?.name}</span>{' '}
              ออกจากระบบ? การลบไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  if (id !== null) {
                    removeItem(id);
                  }
                }}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                ลบอุปกรณ์
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-8">
            <h3 className="text-xl font-semibold text-ink">แก้ไขอุปกรณ์</h3>
            <div className="mt-5 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">ชื่ออุปกรณ์</span>
                <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">รายละเอียด</span>
                <textarea className="min-h-20 w-full rounded-2xl border border-stone-200 px-4 py-3" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-stone-700">จำนวนทั้งหมด</span>
                  <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" type="number" min="1" value={editForm.total_quantity}
                    onChange={(e) => {
                      const t = Math.max(1, Number(e.target.value));
                      const d = Math.min(Number(editForm.damaged_quantity), t);
                      setEditForm({ ...editForm, total_quantity: t, damaged_quantity: d });
                    }}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-stone-700">จำนวนชำรุด</span>
                  <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" type="number" min="0" max={editForm.total_quantity} value={editForm.damaged_quantity}
                    onChange={(e) => {
                      const d = Math.min(Math.max(0, Number(e.target.value)), Number(editForm.total_quantity));
                      setEditForm({ ...editForm, damaged_quantity: d });
                    }}
                  />
                </label>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                พร้อมใช้: {Math.max(0, Number(editForm.total_quantity) - Number(editForm.damaged_quantity))} / {Number(editForm.total_quantity)} · ชำรุด: {Number(editForm.damaged_quantity)}
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">ลิงก์รูปภาพ</span>
                <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">ยกเลิก</button>
              <button type="button" onClick={saveEdit} className="rounded-full bg-cardinal px-5 py-2 text-sm font-semibold text-white transition hover:bg-brick">บันทึก</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

const ManageCategoriesPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategoryItems);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryItem | null>(null);

  const loadCategories = async () => {
    try {
      const response = await api.get<CategoryItem[]>('/categories');
      setCategories(response.data.length ? response.data : defaultCategoryItems);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดหมวดหมู่ได้'));
      setCategories(defaultCategoryItems);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage('');
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError('');
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newCategoryName.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    try {
      await api.post('/categories', { name: newCategoryName.trim() });
      replayAlertMessage(setMessage, 'เพิ่มหมวดหมู่เรียบร้อยแล้ว');
      setNewCategoryName('');
      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถเพิ่มหมวดหมู่ได้'));
    }
  };

  const removeCategory = async (id: number, name: string) => {
    setError('');
    setMessage('');

    try {
      await api.delete(`/categories/${id}`);
      replayAlertMessage(setMessage, `ลบหมวดหมู่ ${getCategoryLabel(name)} เรียบร้อยแล้ว`);
      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถลบหมวดหมู่ได้'));
    }
  };

  return (
    <AppLayout user={session.user} title="จัดการหมวดหมู่" onLogout={onLogout}>
      <FloatingAlerts error={error} success={message} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel p-6">
          <h3 className="text-xl font-semibold text-ink">เพิ่มหมวดหมู่ใหม่</h3>
          <form onSubmit={addCategory} className="mt-5 space-y-4">
            <input
              type="text"
              className="w-full rounded-2xl border border-stone-200 px-4 py-3"
              placeholder="ชื่อหมวดหมู่"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <button type="submit" className="w-full rounded-2xl bg-cardinal px-4 py-3 font-semibold text-white">
              เพิ่มหมวดหมู่
            </button>
          </form>
        </section>
        <section className="glass-panel p-6">
          <h3 className="text-xl font-semibold text-ink">รายการหมวดหมู่</h3>
          <div className="mt-5 space-y-3">
            {categories.map((categoryItem) => (
              <div key={categoryItem.id} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <span className="font-semibold text-ink">{getCategoryLabel(categoryItem.name)}</span>
                <button
                  type="button"
                  onClick={() => setDeleteCategoryTarget(categoryItem)}
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      {deleteCategoryTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-8">
            <h3 className="text-xl font-semibold text-ink">ยืนยันการลบหมวดหมู่</h3>
            <p className="mt-3 text-sm text-stone-600">
              คุณต้องการลบ{' '}
              <span className="font-semibold text-ink">{getCategoryLabel(deleteCategoryTarget.name)}</span>{' '}
              ออกจากระบบหรือไม่? การลบไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCategoryTarget(null)}
                className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deleteCategoryTarget;
                  setDeleteCategoryTarget(null);
                  if (target) {
                    removeCategory(target.id, target.name);
                  }
                }}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                ลบหมวดหมู่
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

const ApproveRequestsPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [equipmentInventory, setEquipmentInventory] = useState<Record<number, EquipmentItem>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('oldest');
  const [confirmDialog, setConfirmDialog] = useState<{
    action: 'approve' | 'reject';
    id: number;
    text: string;
  } | null>(null);

  const loadRecords = async () => {
    try {
      const [borrowResponse, equipmentResponse] = await Promise.all([
        api.get<BorrowRecord[]>('/borrow/all'),
        api.get<EquipmentItem[]>('/equipment'),
      ]);

      setRecords(borrowResponse.data);
      setEquipmentInventory(
        equipmentResponse.data.reduce<Record<number, EquipmentItem>>((accumulator: Record<number, EquipmentItem>, item: EquipmentItem) => {
          accumulator[item.id] = item;
          return accumulator;
        }, {})
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดรายการยืมทั้งหมดได้'));
    }
  };

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 6000);
    const handleWindowFocus = () => {
      loadRecords();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRecords();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const approveRequest = async (id: number) => {
    try {
      await api.put(`/borrow/approve/${id}`);
      replayAlertMessage(setMessage, 'อนุมัติคำขอยืมเรียบร้อยแล้ว');
      setError('');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถอนุมัติคำขอได้'));
    }
  };

  const rejectRequest = async (id: number) => {
    try {
      await api.put(`/borrow/reject/${id}`);
      replayAlertMessage(setMessage, 'ปฏิเสธคำขอเรียบร้อยแล้ว');
      setError('');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถปฏิเสธคำขอได้'));
    }
  };

  const requests = useMemo(
    () => records
      .filter((record: BorrowRecord) => record.status === 'PENDING')
      .sort((a, b) => a.id - b.id),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const keyword = requestSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return requests;
    }

    return requests.filter((record) =>
      (record.user_name || '').toLowerCase().includes(keyword) ||
      (record.student_id || '').toLowerCase().includes(keyword) ||
      (record.equipment_name || '').toLowerCase().includes(keyword)
    );
  }, [requests, requestSearchKeyword]);

  const sortedRecords = useMemo(() => {
    const items = [...filteredRecords];

    items.sort((a, b) => {
      const aTime = parseApiDate(a.borrow_date)?.getTime() || 0;
      const bTime = parseApiDate(b.borrow_date)?.getTime() || 0;

      if (aTime === bTime) {
        return sortOrder === 'latest' ? b.id - a.id : a.id - b.id;
      }

      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });

    return items;
  }, [filteredRecords, sortOrder]);

  const requestOrderLookup = useMemo(
    () => buildBorrowRequestOrderLookup(sortedRecords),
    [sortedRecords]
  );

  const openConfirmDialog = (action: 'approve' | 'reject', id: number, text: string) => {
    setConfirmDialog({ action, id, text });
  };

  const runConfirmedAction = async () => {
    if (!confirmDialog) {
      return;
    }

    const { action, id } = confirmDialog;
    setConfirmDialog(null);

    if (action === 'approve') {
      await approveRequest(id);
      return;
    }

    await rejectRequest(id);
  };

  const getResolvedQuantities = (record: BorrowRecord) => {
    const fromRecordAvailable = Number(record.equipment_available_quantity);
    const fromRecordTotal = Number(record.equipment_total_quantity);

    const hasRecordAvailability =
      Number.isFinite(fromRecordAvailable) &&
      Number.isFinite(fromRecordTotal) &&
      fromRecordTotal > 0;

    if (hasRecordAvailability) {
      return {
        available: Math.max(0, fromRecordAvailable),
        total: Math.max(0, fromRecordTotal),
      };
    }

    const inventory = equipmentInventory[record.equipment_id];
    if (inventory) {
      return {
        available: Math.max(0, Number(inventory.available_quantity || 0)),
        total: Math.max(0, Number(inventory.total_quantity || 0)),
      };
    }

    return {
      available: 0,
      total: 0,
    };
  };

  return (
    <AppLayout user={session.user} title="อนุมัติคำขอ" onLogout={onLogout}>
      <div className="space-y-4">
        <FloatingAlerts error={error} success={message} />
        <p className="text-sm font-medium text-stone-600">รายการคำขอทั้งหมด: {requests.length} รายการ</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-stone-200 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSortOrder('latest')}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                sortOrder === 'latest' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              ส่งคำขอทีหลัง
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('oldest')}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                sortOrder === 'oldest' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              ส่งคำขอก่อน
            </button>
          </div>
          <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
            <Search aria-hidden="true" className="w-5 h-5 text-stone-500" />
            <input
              type="text"
              value={requestSearchKeyword}
              onChange={(event) => setRequestSearchKeyword(event.target.value)}
              placeholder="ค้นหาชื่อผู้ยืม รหัสนิสิต หรือ อุปกรณ์..."
              className="w-full border-0 bg-transparent px-0 py-0 text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>เวลายืม</th>
                <th>วันที่ยืม</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
                <th>เหตุผลการยืม</th>
                <th>สถานะ</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record: BorrowRecord) => (
                <tr key={record.id}>
                  <td>{requestOrderLookup[record.id] ?? '-'}</td>
                  <td>
                    <div className="font-semibold text-ink">{record.user_name}</div>
                    <div className="text-xs text-stone-500">{record.student_id}</div>
                  </td>
                  <td>{record.equipment_name ?? '-'}</td>
                  <td>{record.quantity ?? 1}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.due_date)}</td>
                  <td>{formatTimeHM(record.return_date)}</td>
                  <td>{record.borrow_reason ?? '-'}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const { available, total } = getResolvedQuantities(record);
                        const approveDisabled = available < 1;

                        return (
                          <>
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                              คงเหลือ {available}/{total}
                            </span>
                            <button
                              type="button"
                              onClick={() => openConfirmDialog('approve', record.id, 'คุณต้องการอนุมัติคำขอนี้หรือไม่?')}
                              disabled={approveDisabled}
                              title={approveDisabled ? 'อุปกรณ์นี้หมด ไม่พร้อมให้อนุมัติ' : undefined}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                            >
                              อนุมัติ
                            </button>
                          </>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => openConfirmDialog('reject', record.id, 'คุณต้องการปฏิเสธคำขอนี้หรือไม่?')}
                        className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sortedRecords.length ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            ไม่พบข้อมูล
          </div>
        ) : null}
      </div>
      {confirmDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-panel">
            <h4 className="text-xl font-semibold text-ink">ยืนยันการดำเนินการ</h4>
            <p className="mt-3 text-sm text-stone-700">{confirmDialog.text}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={runConfirmedAction}
                className="rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brick"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

const ConfirmReturnsPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');
  const [dueDateSort, setDueDateSort] = useState<'due-asc' | 'due-desc'>('due-asc');
  const [confirmReturnId, setConfirmReturnId] = useState<number | null>(null);

  const loadRecords = async () => {
    try {
      const response = await api.get<BorrowRecord[]>('/borrow/all');
      setRecords(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดรายการยืมทั้งหมดได้'));
    }
  };

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 6000);
    const handleWindowFocus = () => {
      loadRecords();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRecords();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const confirmReturn = async (id: number) => {
    try {
      setMessage('');
      setError('');
      await api.put(`/borrow/confirm-return/${id}`);
      replayAlertMessage(setMessage, 'ยืนยันการคืนเรียบร้อยแล้ว');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถยืนยันการคืนได้'));
    }
  };

  const requests = useMemo(
    () => records.filter((record: BorrowRecord) => ['APPROVED', 'RETURN_PENDING'].includes(record.status)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const keyword = requestSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return requests;
    }

    return requests.filter((record) =>
      (record.user_name || '').toLowerCase().includes(keyword) ||
      (record.student_id || '').toLowerCase().includes(keyword) ||
      (record.equipment_name || '').toLowerCase().includes(keyword)
    );
  }, [requests, requestSearchKeyword]);

  const sortedRecords = useMemo(() => {
    const items = [...filteredRecords];

    items.sort((a, b) => {
      const aDueTime = parseApiDate(a.due_date)?.getTime() || 0;
      const bDueTime = parseApiDate(b.due_date)?.getTime() || 0;

      if (aDueTime !== bDueTime) {
        return dueDateSort === 'due-asc' ? aDueTime - bDueTime : bDueTime - aDueTime;
      }

      const aApprovedTime = parseApiDate(a.approved_at)?.getTime() || 0;
      const bApprovedTime = parseApiDate(b.approved_at)?.getTime() || 0;

      if (aApprovedTime !== bApprovedTime) {
        return dueDateSort === 'due-asc' ? aApprovedTime - bApprovedTime : bApprovedTime - aApprovedTime;
      }

      return a.id - b.id;
    });

    return items;
  }, [filteredRecords, dueDateSort]);

  const selectedReturnRecord = useMemo(
    () => sortedRecords.find((record: BorrowRecord) => record.id === confirmReturnId) || null,
    [sortedRecords, confirmReturnId]
  );

  const requestOrderLookup = useMemo(
    () =>
      sortedRecords.reduce<Record<number, number>>((accumulator, record, index) => {
        accumulator[record.id] = index + 1;
        return accumulator;
      }, {}),
    [sortedRecords]
  );

  const runConfirmReturn = async () => {
    if (confirmReturnId === null) {
      return;
    }

    const targetId = confirmReturnId;
    setConfirmReturnId(null);
    await confirmReturn(targetId);
  };

  return (
    <AppLayout user={session.user} title="ยืนยันการคืน" onLogout={onLogout}>
      <div className="space-y-4">
        <FloatingAlerts error={error} success={message} />
        <p className="text-sm font-medium text-stone-600">รายการคำขอทั้งหมด: {requests.length} รายการ (อนุมัติแล้ว/รอยืนยันการคืน)</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <span className="font-medium">เรียงตาม</span>
            <select
              value={dueDateSort}
              onChange={(event) => setDueDateSort(event.target.value as 'due-asc' | 'due-desc')}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            >
              <option value="due-asc">กำหนดคืนก่อน</option>
              <option value="due-desc">กำหนดคืนหลัง</option>
            </select>
          </label>
          <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
            <Search aria-hidden="true" className="w-5 h-5 text-stone-500" />
            <input
              type="text"
              value={requestSearchKeyword}
              onChange={(event) => setRequestSearchKeyword(event.target.value)}
              placeholder="ค้นหาชื่อผู้ยืม รหัสนิสิต หรือ อุปกรณ์..."
              className="w-full border-0 bg-transparent px-0 py-0 text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>เวลายืม</th>
                <th>วันที่ยืม</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
                <th>เหตุผลการยืม</th>
                <th>สถานะ</th>
                <th>เวลาอนุมัติการยืม</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record: BorrowRecord) => {
                const isOverdue = record.due_date && new Date(record.due_date) < new Date() && (record.status === 'APPROVED' || record.status === 'RETURN_PENDING');
                return (
                <tr key={record.id} className={isOverdue ? 'bg-red-50' : ''}>
                  <td>{requestOrderLookup[record.id] ?? '-'}</td>
                  <td>
                    <div className="font-semibold text-ink">{record.user_name}</div>
                    <div className="text-xs text-stone-500">{record.student_id}</div>
                  </td>
                  <td>{record.equipment_name}</td>
                  <td>{record.quantity ?? 1}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td className={isOverdue ? 'font-semibold text-red-600' : ''}>{formatDateDMY(record.due_date)}{isOverdue ? ' ⚠️' : ''}</td>
                  <td>{formatTimeHM(record.return_date)}</td>
                  <td>
                    <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                  </td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td>{formatTimeHM(record.approved_at)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setConfirmReturnId(record.id)}
                      disabled={record.status !== 'RETURN_PENDING'}
                      className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {record.status === 'RETURN_PENDING' ? 'ยืนยันการคืน' : 'รอผู้ใช้ส่งคำขอคืน'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filteredRecords.length ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            ไม่พบข้อมูล
          </div>
        ) : null}
      </div>
      {confirmReturnId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-panel">
            <h4 className="text-xl font-semibold text-ink">ยืนยันการคืนอุปกรณ์</h4>
            <p className="mt-3 text-sm text-stone-700">ตรวจสอบข้อมูลก่อนปิดรายการคืนอุปกรณ์</p>
            {selectedReturnRecord ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                <p><span className="font-semibold text-ink">ผู้ยืม:</span> {selectedReturnRecord.user_name} ({selectedReturnRecord.student_id})</p>
                <p className="mt-2"><span className="font-semibold text-ink">อุปกรณ์:</span> {selectedReturnRecord.equipment_name}</p>
                <p className="mt-2"><span className="font-semibold text-ink">วันที่ยืม:</span> {formatDateDMY(selectedReturnRecord.borrow_date)}</p>
                <p className="mt-2"><span className="font-semibold text-ink">กำหนดคืน:</span> {formatDateDMY(selectedReturnRecord.due_date)}</p>
              </div>
            ) : null}
            <p className="mt-4 text-sm text-stone-700">ยืนยันว่าอุปกรณ์ถูกส่งคืนแล้ว?</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReturnId(null)}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={runConfirmReturn}
                className="rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brick"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

const AdminBorrowHistoryPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'returned' | 'rejected'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  const loadRecords = async (page: number = 1) => {
    try {
      const response = await api.get<PaginatedResponse<BorrowRecord>>(`/borrows/history?page=${page}&limit=10`);
      setRecords(response.data.data);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถโหลดรายการยืมทั้งหมดได้'));
    }
  };

  useEffect(() => {
    loadRecords(currentPage);
    const interval = setInterval(() => loadRecords(currentPage), 6000);
    const handleWindowFocus = () => {
      loadRecords(currentPage);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRecords(currentPage);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage]);

  const requests = useMemo(
    () => records.filter((record: BorrowRecord) => ['RETURNED', 'REJECTED'].includes(record.status)),
    [records]
  );

  const statusFilteredRequests = useMemo(() => {
    if (statusFilter === 'returned') {
      return requests.filter((record) => record.status === 'RETURNED');
    }

    if (statusFilter === 'rejected') {
      return requests.filter((record) => record.status === 'REJECTED');
    }

    return requests;
  }, [requests, statusFilter]);

  const filteredRecords = useMemo(() => {
    const keyword = requestSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return statusFilteredRequests;
    }

    return statusFilteredRequests.filter((record) =>
      (record.user_name || '').toLowerCase().includes(keyword) ||
      (record.student_id || '').toLowerCase().includes(keyword) ||
      (record.equipment_name || '').toLowerCase().includes(keyword)
    );
  }, [statusFilteredRequests, requestSearchKeyword]);

  const sortedRecords = useMemo(() => {
    const items = [...filteredRecords];

    const getCompletedDate = (record: BorrowRecord) => {
      if (record.status === 'RETURNED') {
        return record.return_confirmed_at || record.return_date || null;
      }

      if (record.status === 'REJECTED') {
        return record.rejected_at || null;
      }

      return null;
    };

    const getCompletedSortTime = (record: BorrowRecord) => {
      const completedDate = getCompletedDate(record) || record.borrow_date;
      const time = completedDate ? new Date(completedDate).getTime() : 0;
      return Number.isNaN(time) ? 0 : time;
    };

    items.sort((a, b) => {
      const safeATime = getCompletedSortTime(a);
      const safeBTime = getCompletedSortTime(b);

      if (safeATime === safeBTime) {
        return sortOrder === 'latest' ? b.id - a.id : a.id - b.id;
      }

      return sortOrder === 'latest' ? safeBTime - safeATime : safeATime - safeBTime;
    });

    return items;
  }, [filteredRecords, sortOrder]);

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
  const clearCompletedHistory = async () => {
    setShowClearHistoryModal(true);
  };
  const confirmClearCompletedHistory = async () => {
    setClearHistoryLoading(true);
    try {
      const response = await api.delete<{ deletedCount: number }>('/borrow/completed');
      setMessage(`ล้างประวัติเรียบร้อยแล้ว ${response.data.deletedCount} รายการ`);
      setError('');
      const targetPage = currentPage > 1 ? currentPage - 1 : 1;
      setCurrentPage(targetPage);
      loadRecords(targetPage);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถล้างประวัติได้'));
    }
    setClearHistoryLoading(false);
    setShowClearHistoryModal(false);
  };

  const handlePageChange = (page: number) => {
    const totalPages = pagination.totalPages || 1;
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const visiblePageNumbers = useMemo(() => {
    if (!pagination.totalPages) {
      return [] as number[];
    }

    return Array.from({ length: pagination.totalPages }, (_, index) => index + 1);
  }, [pagination.totalPages]);

  return (
    <AppLayout user={session.user} title="ประวัติทั้งหมด" onLogout={onLogout}>
      <div className="space-y-4">
        <FloatingAlerts error={error} success={message} />
        <p className="text-sm font-medium text-stone-600">ทั้งหมด {pagination.total} รายการ</p>
        <div className="history-toolbar flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl border border-stone-200 bg-white/90 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  statusFilter === 'all' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('returned')}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  statusFilter === 'returned' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                คืนแล้ว
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  statusFilter === 'rejected' ? 'bg-cardinal text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                ปฏิเสธ
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm">
            <span className="text-sm font-medium text-stone-600">Sort</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as 'latest' | 'oldest')}
              className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 outline-none"
            >
              <option value="latest">ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
            </select>
          </label>
          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm lg:max-w-md">
            <Search aria-hidden="true" className="w-5 h-5 text-stone-500" />
            <input
              type="text"
              value={requestSearchKeyword}
              onChange={(event) => setRequestSearchKeyword(event.target.value)}
              placeholder="ค้นหาชื่อผู้ยืม รหัสนิสิต หรือ อุปกรณ์..."
              className="w-full border-0 bg-transparent px-0 py-0 text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
          <button
            type="button"
            onClick={clearCompletedHistory}
            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 lg:ml-auto"
          >
            ล้างประวัติที่เสร็จแล้ว
          </button>
          {showClearHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
              <div className="glass-panel w-full max-w-md p-8">
                <h3 className="text-xl font-semibold text-ink">ยืนยันการล้างประวัติ</h3>
                <p className="mt-3 text-sm text-stone-600">
                  คุณต้องการล้างประวัติที่เสร็จสิ้นทั้งหมดใช่หรือไม่?<br />
                  <span className="text-xs text-rose-700">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowClearHistoryModal(false)}
                    className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                    disabled={clearHistoryLoading}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearCompletedHistory}
                    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    disabled={clearHistoryLoading}
                  >
                    {clearHistoryLoading ? 'กำลังล้าง...' : 'ยืนยันล้างประวัติ'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>วันที่ปิดรายการ</th>
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>เวลายืม</th>
                <th>วันที่ยืม</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
                <th>เหตุผลการยืม</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record: BorrowRecord) => (
                <tr key={record.id}>
                  <td>{formatDateDMY(record.status === 'RETURNED' ? (record.return_confirmed_at || record.return_date) : (record.rejected_at || record.borrow_date))}</td>
                  <td>
                    <div className="font-semibold text-ink">{record.user_name}</div>
                    <div className="text-xs text-stone-500">{record.student_id}</div>
                  </td>
                  <td>{record.equipment_name}</td>
                  <td>{record.quantity ?? 1}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.due_date)}</td>
                  <td>{formatTimeHM(record.return_date)}</td>
                  <td>
                    <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                  </td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sortedRecords.length ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            ไม่พบข้อมูล
          </div>
        ) : null}
        {pagination.totalPages > 0 ? (
          <div className="history-pagination flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePageChange(pageNumber)}
                className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                  pageNumber === currentPage
                    ? 'border-cardinal bg-cardinal text-white'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

const RequireAuth = ({ session, role, children }: { session: Session | null; role?: UserRole; children: ReactNode }) => {
  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role && session.user.role !== role) {
    return <Navigate to={getRoleHomePath(session.user.role)} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    setSession(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<LoginSelectPage />} />
      <Route path="/login" element={<LoginPage onAuthenticated={setSession} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/equipment"
        element={
          <RequireAuth session={session}>
            {session ? <EquipmentPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth session={session} role="user">
            {session ? <BorrowHistoryPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/returns"
        element={
          <RequireAuth session={session} role="user">
            {session ? <ReturnEquipmentPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/user/dashboard"
        element={
          <RequireAuth session={session} role="user">
            {session ? <UserDashboardPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <AdminDashboardPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <ManageUsersPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/equipment"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <ManageEquipmentPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <ApproveRequestsPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/returns"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <ConfirmReturnsPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/history"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <AdminBorrowHistoryPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RequireAuth session={session} role="admin">
            {session ? <ManageCategoriesPage session={session} onLogout={handleLogout} /> : null}
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
