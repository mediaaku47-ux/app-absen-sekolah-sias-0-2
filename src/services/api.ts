import {
  User,
  AcademicYear,
  ClassItem,
  Student,
  PrayerType,
  DashboardStats,
  AttendanceItem,
  AttendanceHistoryRecord,
  ReportSummary,
  StudentReportItem,
  ClassReportItem,
  AttendanceStatus,
  AnnouncementItem,
} from '../types.ts';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('absen_solat_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('absen_solat_token');
      localStorage.removeItem('absen_solat_user');
      window.dispatchEvent(new Event('auth_change'));
    }
    throw new Error(data.error || 'Terjadi kesalahan sistem');
  }
  return data as T;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async registerTeacher(payload: {
    name: string;
    email: string;
    password: string;
    school_name?: string;
    school_level?: string;
    prayers?: string[];
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(payload: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async register(payload: {
    school_name: string;
    school_level?: string;
    username: string;
    password: string;
    prayers: string[];
    system_title?: string;
  }): Promise<{ token: string; user: User; message: string; school_name: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getAppSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/settings/app`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateAppSetup(payload: {
    school_name?: string;
    school_level?: string;
    prayers?: string[];
    system_title?: string;
  }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/setup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboardStats(date?: string, classId?: number | string | null): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (classId !== undefined && classId !== null && classId !== 'all') {
      params.append('class_id', String(classId));
    }
    const queryStr = params.toString();
    const url = queryStr ? `${API_BASE}/dashboard/stats?${queryStr}` : `${API_BASE}/dashboard/stats`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Students
  async getStudents(params?: { class_id?: number | string; search?: string; is_active?: number | string }): Promise<Student[]> {
    const query = new URLSearchParams();
    if (params?.class_id) query.append('class_id', String(params.class_id));
    if (params?.search) query.append('search', params.search);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));

    const res = await fetch(`${API_BASE}/students?${query.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getStudentDetail(id: number | string): Promise<{ student: Student; summary: any; history: any[] }> {
    const res = await fetch(`${API_BASE}/students/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createStudent(payload: { name: string; gender: 'L' | 'P'; class_id: number }): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateStudent(id: number | string, payload: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteStudent(id: number | string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Classes
  async getClasses(): Promise<ClassItem[]> {
    const res = await fetch(`${API_BASE}/classes`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createClass(payload: { name: string; grade: string; academic_year_id?: number | null }): Promise<ClassItem> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateClass(id: number | string, payload: Partial<ClassItem>): Promise<ClassItem> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteClass(id: number | string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Prayer Types
  async getPrayerTypes(): Promise<PrayerType[]> {
    const res = await fetch(`${API_BASE}/prayer-types`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createPrayerType(payload: { name: string; is_active?: boolean; sort_order?: number }): Promise<PrayerType> {
    const res = await fetch(`${API_BASE}/prayer-types`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updatePrayerType(id: number | string, payload: Partial<PrayerType>): Promise<PrayerType> {
    const res = await fetch(`${API_BASE}/prayer-types/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deletePrayerType(id: number | string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/prayer-types/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    const res = await fetch(`${API_BASE}/academic-years`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createAcademicYear(payload: { name: string; semester: 'Ganjil' | 'Genap'; is_active?: boolean }): Promise<AcademicYear> {
    const res = await fetch(`${API_BASE}/academic-years`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateAcademicYear(id: number | string, payload: Partial<AcademicYear>): Promise<AcademicYear> {
    const res = await fetch(`${API_BASE}/academic-years/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteAcademicYear(id: number | string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/academic-years/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Attendance
  async getAttendanceSheet(date: string, class_id: number | string, prayer_type_id: number | string): Promise<{
    class: ClassItem;
    prayer: PrayerType;
    date: string;
    isAlreadyRecorded: boolean;
    students: AttendanceItem[];
  }> {
    const res = await fetch(`${API_BASE}/attendance?date=${encodeURIComponent(date)}&class_id=${class_id}&prayer_type_id=${prayer_type_id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async saveAttendance(payload: {
    date: string;
    class_id: number | string;
    prayer_type_id: number | string;
    items: Array<{ student_id: number; status: AttendanceStatus; notes?: string }>;
    mode?: 'create' | 'update' | 'prevent_duplicate' | 'auto';
  }): Promise<{ success: boolean; message: string; totalSaved: number }> {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getAttendanceHistory(params: {
    startDate?: string;
    endDate?: string;
    class_id?: number | string;
    prayer_type_id?: number | string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; limit: number; offset: number; records: AttendanceHistoryRecord[] }> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.class_id) query.append('class_id', String(params.class_id));
    if (params.prayer_type_id) query.append('prayer_type_id', String(params.prayer_type_id));
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/attendance/history?${query.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateSingleAttendance(id: number | string, status: AttendanceStatus, notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/attendance/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  // Reports
  async getReports(params: {
    startDate?: string;
    endDate?: string;
    class_id?: number | string;
    prayer_type_id?: number | string;
    student_id?: number | string;
  }): Promise<{
    summary: ReportSummary;
    students: StudentReportItem[];
    classes: ClassReportItem[];
  }> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.class_id) query.append('class_id', String(params.class_id));
    if (params.prayer_type_id) query.append('prayer_type_id', String(params.prayer_type_id));
    if (params.student_id) query.append('student_id', String(params.student_id));

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Announcements (Pengumuman Siaran Seluruh Pengguna)
  async getUnreadAnnouncementsCount(): Promise<{ unreadCount: number }> {
    const res = await fetch(`${API_BASE}/announcements/unread-count`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAnnouncements(): Promise<{ announcements: AnnouncementItem[] }> {
    const res = await fetch(`${API_BASE}/announcements`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createAnnouncement(payload: {
    title: string;
    content: string;
    category?: string;
  }): Promise<{ success: boolean; announcement: AnnouncementItem }> {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteAnnouncement(id: number | string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
