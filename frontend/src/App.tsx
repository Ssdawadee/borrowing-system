import {
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
import { clearSession, getRoleHomePath, getStoredSession, saveSession } from './runtime/lib/auth';
import { api, getErrorMessage } from './runtime/lib/api';
import {
  AdminDashboardResponse,
  BorrowRecord,
  CategoryItem,
  EquipmentItem,
  Session,
  UserDashboardResponse,
  UserRole,
} from './runtime/types';

interface AuthFormState {
  student_id: string;
  name: string;
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

const defaultCategoryValues = ['Audio', 'Computing', 'Media', 'Presentation'];
const defaultCategoryItems: CategoryItem[] = defaultCategoryValues.map((name, index) => ({ id: index + 1, name }));

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

const getStatusIcon = (status: string) => {
  if (status === 'PENDING') {
    return '⏳';
  }

  if (status === 'APPROVED') {
    return '✅';
  }

  if (status === 'REJECTED') {
    return '❌';
  }

  if (status === 'RETURN_PENDING') {
    return '📩';
  }

  if (status === 'RETURNED') {
    return '📦';
  }

  if (status === 'DAMAGED') {
    return '⚠️';
  }

  return '•';
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

const AuthShell = ({ children }: { children: ReactNode }) => (
  <div className="campus-hero flex min-h-screen items-center justify-center px-4 py-10">
    <div className="glass-panel w-full max-w-6xl overflow-hidden">
      <div className="grid min-h-[720px] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden bg-gradient-to-br from-cardinal via-brick to-ink p-10 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.45em] text-white/70">ชมรมมหาวิทยาลัย</p>
          <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight">
            ยืมอุปกรณ์ของชมรมได้ง่ายขึ้น ด้วยขั้นตอนที่ชัดเจน
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/80">
            อินเทอร์เฟซธีมมหาวิทยาลัย โทนสีแดง ใช้งานง่าย ทั้งสำหรับผู้ยืมและผู้ดูแลในที่เดียว
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
      setError(getErrorMessage(requestError, 'ไม่สามารถเข้าสู่ระบบได้'));
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-500"
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </label>
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
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
  const [successMessage, setSuccessMessage] = useState('');

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((current: AuthFormState) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isValidStudentId(form.student_id)) {
      setError('กรุณากรอกรหัสนักศึกษาให้ขึ้นต้นด้วย b และตามด้วยตัวเลข 10 หลัก');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      await api.post<Session>('/auth/register', {
        student_id: form.student_id,
        name: form.name,
        password: form.password,
      });
      setSuccessMessage('สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
      setForm(initialAuthForm);
      window.setTimeout(() => {
        navigate('/login?role=user');
      }, 1200);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถสมัครสมาชิกได้'));
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-500"
                  aria-label={
                    field === 'password'
                      ? (showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน')
                      : (showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน')
                  }
                >
                  {(field === 'password' ? showPassword : showConfirmPassword) ? '🙈' : '👁️'}
                </button>
              </div>
            ) : (
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-cardinal"
                type="text"
                inputMode={field === 'student_id' ? 'text' : undefined}
                pattern={field === 'student_id' ? 'b\\d{10}' : undefined}
                maxLength={field === 'student_id' ? 11 : undefined}
                placeholder={field === 'student_id' ? 'เช่น b1234567890' : undefined}
                value={form[field as keyof AuthFormState]}
                onChange={(event) => updateField(field as keyof AuthFormState, event.target.value)}
                required
              />
            )}
          </label>
        ))}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        {successMessage ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}
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
      const names = response.data.map((item) => item.name);
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

    if (selectedEquipment.status === 'DAMAGED') {
      setError('ไม่สามารถยืมอุปกรณ์ที่ชำรุดได้');
      return;
    }

    if (!Number.isInteger(borrowForm.quantity) || borrowForm.quantity < 1) {
      setError('กรุณาระบุจำนวนที่ต้องการยืมอย่างน้อย 1 ชิ้น');
      return;
    }

    if (borrowForm.quantity > 3) {
      setError('1 บัญชีสามารถยืมอุปกรณ์ชนิดเดียวกันได้สูงสุด 3 ชิ้นต่อคำขอ');
      return;
    }

    if (borrowForm.quantity > selectedEquipment.available_quantity) {
      setError('จำนวนที่ต้องการยืมมากกว่าจำนวนคงเหลือของอุปกรณ์');
      return;
    }

    if (!borrowForm.borrowDate || !borrowForm.dueDate || !borrowForm.reason.trim()) {
      setError('กรุณากรอกวันที่ยืม วันที่คืน และเหตุผลในการยืมให้ครบถ้วน');
      return;
    }

    const parsedBorrowDate = parseBorrowDateInput(borrowForm.borrowDate);
    const parsedDueDate = parseBorrowDateInput(borrowForm.dueDate);

    if (!parsedBorrowDate || !parsedDueDate) {
      setError('กรุณากรอกวันที่เป็นรูปแบบ วัน/เดือน/ปี เช่น 11/03/2569');
      return;
    }

    if (parsedDueDate <= parsedBorrowDate) {
      setError('วันที่คืนต้องมากกว่าวันที่ยืม');
      return;
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (parsedBorrowDate < todayMidnight) {
      setError('วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว');
      return;
    }

    const maxAdvanceDate = new Date(todayMidnight);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 7);
    if (parsedBorrowDate > maxAdvanceDate) {
      setError('จองอุปกรณ์ล่วงหน้าได้ไม่เกิน 7 วัน');
      return;
    }

    const diffDays = (parsedDueDate.getTime() - parsedBorrowDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 5) {
      setError('ระยะเวลายืมต้องไม่เกิน 5 วัน');
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
      setMessage('ส่งคำขอยืมอุปกรณ์เรียบร้อยแล้ว กรุณารอผู้ดูแลอนุมัติ');
      closeBorrowDialog();
      fetchEquipment();
    } catch (requestError) {
      setSubmissionState('idle');
      setError(getErrorMessage(requestError, 'ไม่สามารถส่งคำขอยืมได้'));
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
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {equipment.map((item: EquipmentItem) => (
            <article key={item.id} className="glass-panel overflow-hidden p-0">
              <div className="relative h-52 bg-stone-200">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
                  {getCategoryLabel(item.category)}
                </span>
                <span
                  className={`absolute right-3 top-14 rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'DAMAGED' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {getStatusLabel(item.status)}
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
                  {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
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
                  <th>เวลายืม</th>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เหตุผลในการยืม</th>
                  <th>เวลาส่งคืน</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record: BorrowRecord) => (
                  <tr key={record.id}>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>
                      <div className="font-semibold text-ink">{record.equipment_name}</div>
                      <div className="text-xs text-stone-500">{getCategoryLabel(record.category || '')}</div>
                    </td>
                    <td>{formatDateDMY(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.due_date)}</td>
                    <td>
                      <p className="max-w-[340px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                    </td>
                    <td>{formatTimeHM(record.return_date)}</td>
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
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
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
      setMessage('ส่งคำขอคืนอุปกรณ์เรียบร้อยแล้ว กรุณารอผู้ดูแลยืนยัน');
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
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <section className="glass-panel p-6">
          <h3 className="text-2xl font-semibold text-ink">รายการที่ยืมอยู่ในปัจจุบัน</h3>
          <p className="mt-1 text-sm text-stone-500">คลิกปุ่มยืนยันการคืนเพื่อส่งคำขอคืนไปยังผู้ดูแล</p>
          <div className="mt-5 table-shell bg-white/80">
            <table>
              <thead>
                <tr>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม</th>
                  <th>เวลายืม</th>
                  <th>กำหนดคืน</th>
                  <th>เวลาส่งคืน</th>
                  <th>เหตุผล</th>
                  <th>ยืนยันการคืน</th>
                </tr>
              </thead>
              <tbody>
                {activeBorrows.map((record) => (
                  <tr key={record.id}>
                    <td>{record.equipment_name}</td>
                    <td>{formatDateDMY(record.borrow_date)}</td>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>{formatDateDMY(record.due_date)}</td>
                    <td>{formatTimeHM(record.return_date)}</td>
                    <td>
                      <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
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
                  <th>เวลายืม</th>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>เหตุผล</th>
                  <th>เวลาส่งคืน</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {pendingReturns.map((record) => (
                  <tr key={record.id}>
                    <td>{formatTimeHM(record.borrow_date)}</td>
                    <td>{record.equipment_name}</td>
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
      .then((response) => setData(response.data))
      .catch((requestError) => setError(getErrorMessage(requestError, 'ไม่สามารถโหลดแดชบอร์ดได้')));
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
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-5 md:grid-cols-3">
          <StatCard label="กำลังยืมอยู่" value={data?.stats.borrowedCount || 0} icon="📘" />
          <StatCard label="คำขอรออนุมัติ" value={data?.stats.pendingCount || 0} accent="from-amber-400 to-orange-500" icon="⏳" />
          <StatCard label="อุปกรณ์พร้อมยืม" value={data?.stats.availableEquipment || 0} accent="from-emerald-500 to-teal-600" icon="🟢" />
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

  const filteredPendingRequests = useMemo(() => {
    const source = data?.pendingRequests || [];
    const keyword = requestSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return source;
    }

    return source.filter((item) =>
      item.user_name.toLowerCase().includes(keyword) ||
      (item.student_id || '').toLowerCase().includes(keyword) ||
      item.equipment_name.toLowerCase().includes(keyword)
    );
  }, [data?.pendingRequests, requestSearchKeyword]);

  useEffect(() => {
    api
      .get<AdminDashboardResponse>('/dashboard/admin')
      .then((response) => setData(response.data))
      .catch((requestError) => setError(getErrorMessage(requestError, 'ไม่สามารถโหลดแดชบอร์ดผู้ดูแลได้')));
  }, []);

  return (
    <AppLayout user={session.user} title="แดชบอร์ดผู้ดูแล" onLogout={onLogout}>
      <div className="space-y-6">
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-5 md:grid-cols-4">
          <StatCard label="รายการอุปกรณ์" value={data?.stats.totalEquipment || 0} icon="📦" />
          <StatCard label="จำนวนคงเหลือ" value={data?.stats.availableUnits || 0} accent="from-emerald-500 to-teal-600" icon="📊" />
          <StatCard label="คำขอรออนุมัติ" value={data?.stats.pendingRequests || 0} accent="from-amber-400 to-orange-500" icon="⏳" />
          <StatCard label="อุปกรณ์ชำรุด" value={data?.stats.damagedItems || 0} accent="from-slate-500 to-slate-700" icon="⚠️" />
        </div>
        <section className="glass-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-ink">คิวคำขอที่ต้องดำเนินการ</h3>
            <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
              <span aria-hidden="true" className="text-sm text-stone-500">🔍</span>
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
                  <th>ผู้ยืม</th>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม</th>
                  <th>เวลายืม</th>
                  <th>กำหนดคืน</th>
                  <th>เหตุผล</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendingRequests.map((request: AdminDashboardResponse['pendingRequests'][number]) => (
                  <tr key={request.id}>
                    <td>{request.user_name}</td>
                    <td>{request.equipment_name}</td>
                    <td>{formatDateDMY(request.borrow_date)}</td>
                    <td>{formatTimeHM(request.borrow_date)}</td>
                    <td>{formatDateDMY(request.due_date)}</td>
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

const ManageEquipmentPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategoryItems);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Media',
    description: '',
    total_quantity: 1,
    available_quantity: 1,
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
      const names = items.map((item) => item.name);

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
    setError('');
    setMessage('');

    try {
      await api.post('/equipment', {
        ...form,
        total_quantity: Number(form.total_quantity),
        available_quantity: Number(form.available_quantity),
      });
      setMessage('เพิ่มอุปกรณ์เรียบร้อยแล้ว');
      setForm({
        name: '',
        category: 'Media',
        description: '',
        total_quantity: 1,
        available_quantity: 1,
        image_url: '',
        status: 'NORMAL',
      });
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถเพิ่มอุปกรณ์ได้'));
    }
  };

  const toggleDamage = async (item: EquipmentItem) => {
    setError('');
    setMessage('');

    try {
      await api.put(`/equipment/${item.id}`, {
        ...item,
        status: item.status === 'NORMAL' ? 'DAMAGED' : 'NORMAL',
      });
      setMessage('อัปเดตสถานะอุปกรณ์เรียบร้อยแล้ว');
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถอัปเดตสถานะอุปกรณ์ได้'));
    }
  };

  const removeItem = async (id: number) => {
    setError('');
    setMessage('');

    try {
      await api.delete(`/equipment/${id}`);
      setMessage('ลบอุปกรณ์เรียบร้อยแล้ว');
      loadEquipment();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถลบอุปกรณ์ได้'));
    }
  };

  return (
    <AppLayout user={session.user} title="จัดการอุปกรณ์" onLogout={onLogout}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel p-6">
          <h3 className="text-xl font-semibold text-ink">เพิ่มอุปกรณ์</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
            {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
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
                  onChange={(event) => setForm({ ...form, total_quantity: Number(event.target.value) })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">จำนวนที่พร้อมยืมตอนนี้ (เพิ่มครั้งนี้กี่ชิ้น)</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3"
                  type="number"
                  min="0"
                  placeholder="เช่น 15"
                  value={form.available_quantity}
                  onChange={(event) => setForm({ ...form, available_quantity: Number(event.target.value) })}
                  required
                />
              </label>
            </div>
            <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="ลิงก์รูปภาพ" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
            <select className="w-full rounded-2xl border border-stone-200 px-4 py-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="NORMAL">ปกติ</option>
              <option value="DAMAGED">ชำรุด</option>
            </select>
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
                  <td>{item.available_quantity}/{item.total_quantity}</td>
                  <td>{getStatusLabel(item.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDamage(item)}
                        className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600"
                      >
                        สลับสถานะ
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
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
                onClick={() => { const id = deleteConfirmId; setDeleteConfirmId(null); removeItem(id); }}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                ลบอุปกรณ์
              </button>
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
      setMessage('เพิ่มหมวดหมู่เรียบร้อยแล้ว');
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
      setMessage(`ลบหมวดหมู่ ${getCategoryLabel(name)} เรียบร้อยแล้ว`);
      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถลบหมวดหมู่ได้'));
    }
  };

  return (
    <AppLayout user={session.user} title="จัดการหมวดหมู่" onLogout={onLogout}>
      {error && <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {message && <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
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
                  onClick={() => removeCategory(categoryItem.id, categoryItem.name)}
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

const ApproveRequestsPage = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [equipmentInventory, setEquipmentInventory] = useState<Record<number, EquipmentItem>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
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
        equipmentResponse.data.reduce<Record<number, EquipmentItem>>((accumulator, item) => {
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
      setMessage('อนุมัติคำขอยืมเรียบร้อยแล้ว');
      setError('');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถอนุมัติคำขอได้'));
    }
  };

  const rejectRequest = async (id: number) => {
    try {
      await api.put(`/borrow/reject/${id}`);
      setMessage('ปฏิเสธคำขอเรียบร้อยแล้ว');
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
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
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
            <span aria-hidden="true" className="text-sm text-stone-500">🔍</span>
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
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>วันที่ยืม</th>
                <th>เวลายืม</th>
                <th>เหตุผลการยืม</th>
                <th>สถานะ</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record: BorrowRecord) => (
                <tr key={record.id}>
                  <td>
                    <div className="font-semibold text-ink">{record.user_name}</div>
                    <div className="text-xs text-stone-500">{record.student_id}</div>
                  </td>
                  <td>{record.equipment_name ?? '-'}</td>
                  <td>{record.quantity ?? 1}</td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>{record.borrow_reason ?? '-'}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td>{formatDateDMY(record.due_date)}</td>
                  <td>{formatTimeHM(record.return_date)}</td>
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
      await api.put(`/borrow/confirm-return/${id}`);
      setMessage('ยืนยันการคืนเรียบร้อยแล้ว');
      setError('');
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

  const selectedReturnRecord = useMemo(
    () => filteredRecords.find((record: BorrowRecord) => record.id === confirmReturnId) || null,
    [filteredRecords, confirmReturnId]
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
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <p className="text-sm font-medium text-stone-600">รายการคำขอทั้งหมด: {requests.length} รายการ (อนุมัติแล้ว/รอยืนยันการคืน)</p>
        <div className="flex justify-end">
          <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
            <span aria-hidden="true" className="text-sm text-stone-500">🔍</span>
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
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>วันที่ยืม</th>
                <th>เวลายืม</th>
                <th>เหตุผลการยืม</th>
                <th>สถานะ</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record: BorrowRecord) => (
                <tr key={record.id}>
                  <td>
                    <div className="font-semibold text-ink">{record.user_name}</div>
                    <div className="text-xs text-stone-500">{record.student_id}</div>
                  </td>
                  <td>{record.equipment_name}</td>
                  <td>{record.quantity ?? 1}</td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>
                    <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                  </td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)} {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td>{formatDateDMY(record.due_date)}</td>
                  <td>{formatTimeHM(record.return_date)}</td>
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
              ))}
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestSearchKeyword, setRequestSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

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

  const requests = useMemo(
    () => records.filter((record: BorrowRecord) => ['RETURNED', 'REJECTED'].includes(record.status)),
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

  const clearCompletedHistory = async () => {
    const ok = window.confirm('ยืนยันการล้างประวัติที่เสร็จสิ้นทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้');
    if (!ok) {
      return;
    }

    try {
      const response = await api.delete<{ deletedCount: number }>('/borrow/completed');
      setMessage(`ล้างประวัติเรียบร้อยแล้ว ${response.data.deletedCount} รายการ`);
      setError('');
      loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ไม่สามารถล้างประวัติได้'));
    }
  };

  return (
    <AppLayout user={session.user} title="ประวัติดำเนินการที่เสร็จสิ้นแล้ว" onLogout={onLogout}>
      <div className="space-y-4">
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <p className="text-sm font-medium text-stone-600">รายการคำขอทั้งหมด: {requests.length} รายการ (คืนแล้ว/ปฏิเสธแล้ว)</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              onClick={clearCompletedHistory}
              className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              ล้างประวัติที่เสร็จสิ้นแล้ว
            </button>
          </div>
          <label className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-md">
            <span aria-hidden="true" className="text-sm text-stone-500">🔍</span>
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
                <th>วันที่ปิดรายการ</th>
                <th>ผู้ยืม</th>
                <th>อุปกรณ์</th>
                <th>จำนวนที่ยืม</th>
                <th>เหตุผลการยืม</th>
                <th>วันที่ยืม</th>
                <th>เวลายืม</th>
                <th>กำหนดคืน</th>
                <th>เวลาส่งคืน</th>
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
                  <td>
                    <p className="max-w-[360px] text-sm text-stone-700">{record.borrow_reason || '-'}</p>
                  </td>
                  <td>{formatDateDMY(record.borrow_date)}</td>
                  <td>{formatTimeHM(record.borrow_date)}</td>
                  <td>{formatDateDMY(record.due_date)}</td>
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
        {!sortedRecords.length ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            ไม่พบข้อมูล
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
