import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Info,
  Lock,
  Search,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ClassItem, PrayerType, AttendanceItem, AttendanceStatus } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { PageLoader } from '../components/PageLoader.tsx';
import { StudentDetailModal } from '../components/StudentDetailModal.tsx';

interface AttendanceProps {
  initialParams?: { class_id?: number; prayer_type_id?: number; date?: string };
  onNavigate: (path: string) => void;
}

// Fungsi helper untuk mendapatkan tanggal lokal hari ini secara akurat (tidak terpengaruh offset UTC)
const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Attendance: React.FC<AttendanceProps> = ({ initialParams, onNavigate }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [prayers, setPrayers] = useState<PrayerType[]>([]);

  // Selection states: Otomatis sesuai tanggal lokal hari ini secara akurat
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return initialParams?.date || getTodayLocalDate();
  });
  const [selectedClassId, setSelectedClassId] = useState<number | 'all' | ''>(
    initialParams?.class_id || 'all'
  );
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | ''>(
    initialParams?.prayer_type_id || ''
  );

  // Sinkronisasi otomatis tanggal hari ini secara berkala dan saat jendela aplikasi aktif kembali
  useEffect(() => {
    if (initialParams?.date) {
      setSelectedDate(initialParams.date);
      return;
    }

    const syncTodayDate = () => {
      setSelectedDate(getTodayLocalDate());
    };

    window.addEventListener('focus', syncTodayDate);
    document.addEventListener('visibilitychange', syncTodayDate);
    const interval = setInterval(syncTodayDate, 60000); // Cek setiap 1 menit

    return () => {
      window.removeEventListener('focus', syncTodayDate);
      document.removeEventListener('visibilitychange', syncTodayDate);
      clearInterval(interval);
    };
  }, [initialParams?.date]);

  // Student Attendance List state
  const [students, setStudents] = useState<AttendanceItem[]>([]);
  const [isAlreadyRecorded, setIsAlreadyRecorded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [lastSaveType, setLastSaveType] = useState<'create' | 'update'>('create');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const successTimerRef = useRef<any>(null);

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const [alert, setAlert] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(
    null
  );

  // Student Detail Modal state
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

  // Search query (mendukung nama, NIS, kelas, serta kata kunci 'belum' untuk murid belum diabsen)
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (q.includes('belum')) {
        return !s.status || !s.attendance_id;
      }
      if (q.includes('sudah')) {
        return Boolean(s.attendance_id);
      }
      const matchName = s.name.toLowerCase().includes(q);
      const matchClass = s.class_name ? s.class_name.toLowerCase().includes(q) : false;
      return matchName || matchClass;
    }
    return true;
  });

  // Load classes and prayer types on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [classList, prayerList] = await Promise.all([api.getClasses(), api.getPrayerTypes()]);
        setClasses(classList);
        const activePrayers = prayerList.filter((p) => p.is_active === 1);
        setPrayers(activePrayers);

        // Default ke 'all' (Semua Kelas) jika belum dipilih
        if (!selectedClassId) {
          setSelectedClassId('all');
        }
        if (!selectedPrayerId && activePrayers.length > 0) {
          // Select Zuhur or first
          const zuhur = activePrayers.find((p) => p.name.toLowerCase() === 'zuhur');
          setSelectedPrayerId(zuhur ? zuhur.id : activePrayers[0].id);
        }
      } catch (err: any) {
        setAlert({ type: 'error', message: 'Gagal memuat daftar kelas dan jenis solat' });
      }
    };
    loadMetadata();

    window.addEventListener('settings_updated', loadMetadata);
    return () => {
      window.removeEventListener('settings_updated', loadMetadata);
    };
  }, []);

  // Fetch student sheet when date, class, or prayer changes
  // Fetch student sheet when date, class, or prayer changes
  const loadSheet = async (options?: { preserveSuccessMessage?: boolean }) => {
    if (!selectedClassId || !selectedPrayerId || !selectedDate) return;

    if (!options?.preserveSuccessMessage) {
      setIsLoading(true);
      setAlert(null);
      setIsSavedSuccess(false);
      setHasUnsavedChanges(false);
    }

    try {
      const data = await api.getAttendanceSheet(selectedDate, selectedClassId, selectedPrayerId);
      setStudents(data.students);
      setIsAlreadyRecorded(data.isAlreadyRecorded);
    } catch (err: any) {
      if (!options?.preserveSuccessMessage) {
        setAlert({ type: 'error', message: err.message || 'Gagal memuat daftar siswa' });
      }
      setStudents([]);
    } finally {
      if (!options?.preserveSuccessMessage) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedPrayerId && selectedDate) {
      loadSheet();
    }
  }, [selectedClassId, selectedPrayerId, selectedDate]);

  // Set All Present ("Semua Hadir" quick action)
  const handleSetAllPresent = () => {
    setIsSavedSuccess(false);
    setHasUnsavedChanges(true);
    setAlert(null);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'Hadir',
        // keep notes clean unless uzur was haid
        notes: s.notes === 'Haid' ? '' : s.notes,
      }))
    );
  };

  // Update single student status
  const handleStatusChange = (studentId: number, newStatus: AttendanceStatus) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    setIsSavedSuccess(false);
    setHasUnsavedChanges(true);
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id !== studentId) return s;
        // Keterangan hanya ada pada Izin dan Sakit. Untuk Hadir dan Alfa (Tidak Hadir), bersihkan catatan.
        const isNotExempt = newStatus === 'Hadir' || newStatus === 'Tidak Hadir';
        return {
          ...s,
          status: newStatus,
          notes: isNotExempt ? '' : s.notes,
        };
      })
    );
  };

  // Update notes
  const handleNotesChange = (studentId: number, notes: string) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    setIsSavedSuccess(false);
    setHasUnsavedChanges(true);
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, notes } : s))
    );
  };

  // Save or Update Attendance
  const handleSave = async () => {
    if (!selectedClassId || !selectedPrayerId || !selectedDate || students.length === 0 || !isAllFilled) {
      if (!isAllFilled) {
        setAlert({
          type: 'warning',
          message: filledCount === 0
            ? 'Absensi masih kosong. Tentukan status seluruh siswa terlebih dahulu sebelum menyimpan.'
            : `Masih ada ${unassignedCount} siswa yang belum diabsen. Lengkapi seluruh absensi sebelum menyimpan.`,
        });
      } else {
        setAlert({ type: 'error', message: 'Data absensi tidak lengkap' });
      }
      return;
    }

    setIsSaving(true);
    setAlert(null);
    const isUpdating = isAlreadyRecorded;
    setLastSaveType(isUpdating ? 'update' : 'create');

    try {
      const items = students.map((s) => ({
        student_id: s.student_id,
        status: (s.status || 'Hadir') as AttendanceStatus,
        notes: s.notes,
      }));

      await api.saveAttendance({
        date: selectedDate,
        class_id: selectedClassId,
        prayer_type_id: selectedPrayerId,
        items,
        mode: 'auto',
      });

      setIsAlreadyRecorded(true);
      setIsSavedSuccess(true);
      setHasUnsavedChanges(false);
      setAlert(null);

      // Status 'Absensi Berhasil' pada tombol aktif selama 2.5 detik lalu kembali normal
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        setIsSavedSuccess(false);
      }, 2500);

      // Synchronize sheet data without clearing or overwriting the success status
      await loadSheet({ preserveSuccessMessage: true });
    } catch (err: any) {
      setIsSavedSuccess(false);
      setAlert({ type: 'error', message: err.message || 'Gagal menyimpan data absensi' });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live counts (Hadir, Alfa, Izin, Sakit)
  const summaryCounts = {
    total: students.length,
    hadir: students.filter((s) => s.status === 'Hadir').length,
    tidakHadir: students.filter((s) => s.status === 'Tidak Hadir').length,
    izin: students.filter((s) => s.status === 'Izin').length,
    sakit: students.filter((s) => s.status === 'Sakit').length,
  };

  const filledCount = students.filter((s) => s.status !== null).length;
  const unassignedCount = students.length - filledCount;
  const isAllFilled = students.length > 0 && unassignedCount === 0;

  return (
    <div className="flex-1 pb-24 lg:pb-10 bg-slate-100/70 min-h-screen">
      <Header
        title="Absensi Solat"
        onNavigate={onNavigate}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Filter Selection Panel (Langsung Halaman Tanpa Kartu) */}
        <div className="space-y-3.5 sm:space-y-4">
          {/* Baris 1: Tanggal & Kelas Dijadikan Satu Baris Dibagi Dua */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Tanggal (Otomatis & Terkunci Tidak Bisa Dirubah) */}
            <div>
              <div className="mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Tanggal
                </label>
              </div>
              <input
                type="date"
                value={selectedDate}
                readOnly
                disabled
                tabIndex={-1}
                className="w-full bg-slate-200/80 border border-slate-300 rounded-xl px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 font-bold cursor-not-allowed select-none opacity-90 shadow-2xs"
                title="Tanggal otomatis hari ini dan terkunci sesuai aturan sistem"
              />
            </div>

            {/* Kelas (Termasuk Pilihan Semua Kelas) */}
            <div>
              <div className="mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pilih Kelas
                </label>
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val === 'all' ? 'all' : Number(val));
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 2: Jenis Solat (Sesuai Pilihan Pengguna di Pengaturan) */}
          <div>
            <div className="mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Jenis Solat
              </label>
            </div>
            <select
              value={selectedPrayerId}
              onChange={(e) => setSelectedPrayerId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              {prayers.length === 0 ? (
                <option value="">Tidak ada jenis solat aktif di pengaturan</option>
              ) : (
                prayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    Solat {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Baris 3: Input Pencarian Murid dengan Ikon Kaca Pembesar */}
          <div className="pt-0.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau ketik 'belum' untuk murid belum diabsen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-16 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status / Duplicate Notification Banner */}
        {alert && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-start space-x-3 transition-all ${
              alert.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                : alert.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : alert.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : alert.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : alert.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{alert.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              title="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ringkasan Jumlah Kehadiran (Satu Baris Rapi, 4 Status Tanpa Uzur) */}
        <div className="bg-slate-50/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center">
            {/* Hadir (Klik untuk langsung menandai seluruhnya Hadir) */}
            <div
              onClick={handleSetAllPresent}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSetAllPresent();
                }
              }}
              title="Klik untuk langsung menandai seluruh murid Hadir"
              className="bg-white rounded-xl p-2.5 sm:p-3.5 border border-slate-300 shadow-xs flex flex-col items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-sm cursor-pointer select-none group active:scale-95"
            >
              <span className="font-poppins font-black text-xl sm:text-2xl text-slate-900 group-hover:text-emerald-700 leading-tight tracking-tight transition-colors">
                {summaryCounts.hadir}
              </span>
              <span className="font-outfit font-bold text-[10px] sm:text-xs text-emerald-800 tracking-wider uppercase mt-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300/80 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                Hadir
              </span>
            </div>

            {/* Alfa */}
            <div className="bg-white rounded-xl p-2.5 sm:p-3.5 border border-slate-300 shadow-xs flex flex-col items-center justify-center transition-all hover:border-slate-400 hover:shadow-sm">
              <span className="font-poppins font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight">
                {summaryCounts.tidakHadir}
              </span>
              <span className="font-outfit font-bold text-[10px] sm:text-xs text-rose-800 tracking-wider uppercase mt-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-300/80">
                Alfa
              </span>
            </div>

            {/* Izin */}
            <div className="bg-white rounded-xl p-2.5 sm:p-3.5 border border-slate-300 shadow-xs flex flex-col items-center justify-center transition-all hover:border-slate-400 hover:shadow-sm">
              <span className="font-poppins font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight">
                {summaryCounts.izin}
              </span>
              <span className="font-outfit font-bold text-[10px] sm:text-xs text-sky-800 tracking-wider uppercase mt-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-300/80">
                Izin
              </span>
            </div>

            {/* Sakit */}
            <div className="bg-white rounded-xl p-2.5 sm:p-3.5 border border-slate-300 shadow-xs flex flex-col items-center justify-center transition-all hover:border-slate-400 hover:shadow-sm">
              <span className="font-poppins font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight">
                {summaryCounts.sakit}
              </span>
              <span className="font-outfit font-bold text-[10px] sm:text-xs text-amber-800 tracking-wider uppercase mt-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-300/80">
                Sakit
              </span>
            </div>
          </div>
        </div>

        {/* Student List View */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <PageLoader message="memuat data absensi" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-2xs">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700">Tidak ada murid ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">
              Pastikan kelas yang dipilih telah memiliki murid aktif terdaftar.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-2xs">
            <h4 className="font-poppins font-bold text-slate-800 text-sm sm:text-base">
              Tidak ada murid yang cocok dengan pencarian
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Coba periksa kata kunci nama atau status pencarian murid.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tampilkan Semua Murid
              </button>
            )}
          </div>
        ) : (
          /* ================= MODEL KARTU TIAP MURID (HADIR, ALFA, IZIN, SAKIT) ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredStudents.map((student) => {
              const isHadir = student.status === 'Hadir';
              const isAlfa = student.status === 'Tidak Hadir';
              const isIzin = student.status === 'Izin';
              const isSakit = student.status === 'Sakit';

              return (
                <div
                  key={student.student_id}
                  className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-2xs hover:shadow-xs transition-all duration-200 ease-out ${
                    isHadir
                      ? 'border-emerald-300 bg-white'
                      : isAlfa
                      ? 'border-rose-300 bg-rose-50/20'
                      : isIzin
                      ? 'border-blue-300 bg-blue-50/20'
                      : isSakit
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  {/* Nama, Kelas & Status Pencatatan */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => setDetailStudentId(student.student_id)}
                        className="font-poppins font-black text-sm sm:text-base text-slate-900 hover:text-emerald-700 transition-colors text-left cursor-pointer flex items-center gap-1 group"
                        title="Klik untuk melihat rincian murid"
                      >
                        <span className="group-hover:underline decoration-emerald-500 underline-offset-2">
                          {student.name}
                        </span>
                      </button>
                      <p className="font-jakarta text-xs text-slate-500 font-bold mt-1">
                        {student.class_name || (classes.find((c) => c.id === Number(selectedClassId))?.name || 'Semua Kelas')}
                      </p>
                    </div>
                    {!student.status ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                        Belum Diisi
                      </span>
                    ) : !student.attendance_id ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full shrink-0">
                        Belum Disimpan
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full shrink-0">
                        Sudah Diabsen
                      </span>
                    )}
                  </div>

                  {/* Pilihan Status Kehadiran (Hadir, Alfa, Izin, Sakit) */}
                  <div className="grid grid-cols-4 gap-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.student_id, 'Hadir')}
                      className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isHadir
                          ? 'bg-emerald-600 text-white shadow-xs font-black border-2 border-emerald-600'
                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      Hadir
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.student_id, 'Tidak Hadir')}
                      className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isAlfa
                          ? 'bg-rose-600 text-white shadow-xs font-black border-2 border-rose-600'
                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      Alfa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.student_id, 'Izin')}
                      className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isIzin
                          ? 'bg-blue-600 text-white shadow-xs font-black border-2 border-blue-600'
                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      Izin
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.student_id, 'Sakit')}
                      className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isSakit
                          ? 'bg-amber-500 text-white shadow-xs font-black border-2 border-amber-500'
                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      Sakit
                    </button>
                  </div>

                  {/* Input Catatan / Alasan: Cukup ada pada Izin dan Sakit, Alfa tidak */}
                  {(isIzin || isSakit) && (
                    <div className="pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder={
                          isSakit
                            ? 'Keterangan sakit (cth: Demam)...'
                            : 'Keterangan izin...'
                        }
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tombol Simpan Absensi di Bawah (Satu-satunya Tombol Simpan) */}
        <div className="sticky bottom-16 sm:bottom-6 z-30 pt-3 pb-2 max-w-xl mx-auto space-y-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || students.length === 0 || !isAllFilled}
            className={`w-full py-3.5 sm:py-4 font-poppins font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center space-x-2.5 transition-all duration-200 ${
              isSaving
                ? 'bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] text-white opacity-90 cursor-wait shadow-md'
                : isSavedSuccess
                ? 'bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] text-white ring-4 ring-emerald-400/40 cursor-pointer shadow-xl shadow-emerald-950/25'
                : !isAllFilled
                ? 'bg-slate-200/90 border-2 border-dashed border-slate-300 text-slate-500 cursor-not-allowed shadow-none select-none'
                : 'bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white cursor-pointer border border-emerald-950/40 shadow-xl shadow-emerald-950/25 ring-1 ring-white/15'
            }`}
          >
            {isSaving ? (
              <>
                <img
                  src="/assets/loader-spinner.png"
                  alt="Menyimpan..."
                  className="w-5 h-5 animate-spin invert brightness-200"
                />
                <span>Menyimpan ke Database...</span>
              </>
            ) : isSavedSuccess ? (
              <span>Absensi Berhasil</span>
            ) : !isAllFilled ? (
              <span>
                {filledCount === 0
                  ? 'Absensi Masih Kosong'
                  : `Lengkapi Absensi (${unassignedCount} Siswa Belum Diisi)`}
              </span>
            ) : isAlreadyRecorded ? (
              <span>Perbarui Data Absensi</span>
            ) : (
              <span>Simpan Absensi</span>
            )}
          </button>
        </div>
      </div>

      {/* Modal Rincian Murid & Statistik Kehadiran */}
      <StudentDetailModal
        studentId={detailStudentId}
        isOpen={!!detailStudentId}
        onClose={() => setDetailStudentId(null)}
      />
    </div>
  );
};
