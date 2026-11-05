export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  semester: 'Ganjil' | 'Genap';
  is_active: number;
  created_at?: string;
}

export interface ClassItem {
  id: number;
  name: string;
  grade: string;
  academic_year_id?: number | null;
  academic_year_name?: string;
  semester?: string;
  student_count?: number;
}

export interface Student {
  id: number;
  name: string;
  gender: 'L' | 'P';
  class_id: number;
  class_name?: string;
  grade?: string;
  is_active: number;
  created_at?: string;
}

export interface PrayerType {
  id: number;
  name: string;
  is_active: number;
  sort_order: number;
}

export type AttendanceStatus = 'Hadir' | 'Tidak Hadir' | 'Izin' | 'Sakit' | 'Uzur';

export interface AttendanceItem {
  student_id: number;
  name: string;
  gender: 'L' | 'P';
  class_name?: string;
  attendance_id?: number | null;
  status: AttendanceStatus | null;
  notes: string;
  recorded_at?: string;
}

export interface AttendanceHistoryRecord {
  id: number;
  student_id: number;
  student_name: string;
  gender: 'L' | 'P';
  class_name: string;
  prayer_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendancePeriodStat {
  periodType: 'daily' | 'weekly' | 'monthly';
  title: string;
  subtitle: string;
  dateRangeText: string;
  startDate: string;
  endDate: string;
  total: number;
  hadir: number;
  tidakHadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
  hasData: boolean;
  prayerBreakdown?: Array<{
    id: number;
    name: string;
    total: number;
    hadir: number;
    percentage: number;
  }>;
}

export interface DashboardStats {
  school_name?: string;
  system_title?: string;
  totalStudents: number;
  totalClasses: number;
  today: {
    date: string;
    total: number;
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  };
  daily?: AttendancePeriodStat;
  weekly?: AttendancePeriodStat;
  monthly?: AttendancePeriodStat;
  last7Days: Array<{
    attendance_date: string;
    total: number;
    hadir: number;
    tidak_hadir: number;
    izin: number;
    sakit: number;
    uzur: number;
  }>;
  classStats: Array<{
    id: number;
    class_name: string;
    grade?: string;
    total: number;
    hadir: number;
    tidak_hadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  }>;
  prayerStats: Array<{
    id: number;
    prayer_name: string;
    total: number;
    hadir: number;
    tidak_hadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  }>;
  todayPrayerStats?: Array<{
    id: number;
    prayer_name: string;
    total: number;
    hadir: number;
    tidak_hadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  }>;
  todayChecklist: Array<{
    class_id: number;
    class_name: string;
    prayer_type_id: number;
    prayer_name: string;
    student_count: number;
    recorded_count: number;
    is_completed: boolean;
  }>;
  lowAttendanceStudents: Array<{
    id: number;
    name: string;
    class_name: string;
    total_attendance: number;
    hadir: number;
    tidak_hadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  }>;
}

export interface ReportSummary {
  total: number;
  hadir: number;
  tidakHadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
}

export interface StudentReportItem {
  student_id: number;
  name: string;
  gender: 'L' | 'P';
  class_name: string;
  total: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
}

export interface ClassReportItem {
  class_id: number;
  class_name: string;
  grade: string;
  total_students: number;
  total_attendance: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
  tidakHadirPct: number;
  izinPct: number;
  sakitPct: number;
  uzurPct: number;
}

export interface AnnouncementItem {
  id: number;
  user_id: number;
  author_name: string;
  author_username?: string;
  author_full_name?: string;
  author_role?: string;
  title: string;
  content: string;
  category: 'general' | 'important' | 'system' | 'prayer';
  created_at: string;
  views_count?: number;
}


