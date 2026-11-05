import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  GraduationCap,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  HeartPulse,
  AlertTriangle,
  TrendingUp,
  User,
  Award,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';
import {
  ClassItem,
  PrayerType,
  ReportSummary,
  StudentReportItem,
  ClassReportItem,
  Student,
} from '../types.ts';
import { Header } from '../components/Header.tsx';
import { PageLoader } from '../components/PageLoader.tsx';
import { exportRecapToExcel, exportRecapToPDF } from '../utils/exportUtils.ts';

interface ReportsProps {
  onNavigate?: (path: string, params?: any) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigate }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [prayers, setPrayers] = useState<PrayerType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Period filters
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Attribute filters
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Data states
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [studentRecap, setStudentRecap] = useState<StudentReportItem[]>([]);
  const [classRecap, setClassRecap] = useState<ClassReportItem[]>([]);
  const [schoolName, setSchoolName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cList, pList, sList, settings] = await Promise.all([
          api.getClasses(),
          api.getPrayerTypes(),
          api.getStudents(),
          api.getAppSettings(),
        ]);
        setClasses(cList);
        if (settings?.school_name) {
          setSchoolName(settings.school_name);
        }
        // Filter solat harus sesuai dengan pengaturan (hanya yang aktif)
        const activePrayers = (pList as PrayerType[]).filter((p: PrayerType) => p.is_active === 1);
        setPrayers(activePrayers);
        setStudents(sList);

        setSelectedPrayerId((prev) => {
          if (!prev) return '';
          const stillActive = activePrayers.some((p: PrayerType) => String(p.id) === String(prev));
          return stillActive ? prev : '';
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadFilters();

    window.addEventListener('settings_updated', loadFilters);
    window.addEventListener('focus', loadFilters);
    return () => {
      window.removeEventListener('settings_updated', loadFilters);
      window.removeEventListener('focus', loadFilters);
    };
  }, []);

  // Quick period helper
  const handlePeriodChange = (type: 'day' | 'week' | 'month' | 'custom') => {
    setPeriodType(type);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (type === 'day') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'week') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      setStartDate(pastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const fetchReports = async () => {
    // Tombol tidak bisa ditekan kalau belum ada pilihan kelas/siswa
    if (!selectedClassId && !selectedStudentId) {
      setSummary(null);
      setStudentRecap([]);
      setClassRecap([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.getReports({
        startDate,
        endDate,
        class_id: selectedClassId && selectedClassId !== 'all' ? selectedClassId : undefined,
        prayer_type_id: selectedPrayerId || undefined,
        student_id: selectedStudentId || undefined,
      });
      setSummary(data.summary);
      setStudentRecap(data.students);
      setClassRecap(data.classes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedClassId, selectedPrayerId, selectedStudentId]);

  // Validation rules: Belum ada pilihan atau data masih kosong
  const hasSelection = Boolean(selectedClassId || selectedStudentId);
  const hasData = Boolean(summary && summary.total > 0 && studentRecap.length > 0);
  const isExportDisabled = !hasSelection || !hasData || !startDate || !endDate || isLoading || isExporting;

  const getExportStatusMessage = () => {
    if (isExporting) return 'Sedang memproses ekspor berkas...';
    if (isLoading) return 'Memuat data kehadiran...';
    if (!startDate || !endDate) return 'Tentukan periode tanggal laporan terlebih dahulu';
    if (!hasSelection) return 'Pilih kelas atau siswa terlebih dahulu sebelum mengunduh';
    if (!hasData) return 'Data absensi masih kosong pada periode atau pilihan filter ini';
    return `Laporan siap diekspor (${studentRecap.length} data siswa, ${summary?.total || 0} catatan absensi)`;
  };

  // Export Excel
  const handleExportExcel = () => {
    if (isExportDisabled) return;
    setIsExporting(true);
    try {
      const className = selectedClassId && selectedClassId !== 'all'
        ? classes.find((c) => c.id === Number(selectedClassId))?.name || 'Semua Kelas'
        : 'Semua Kelas';

      const exportData = studentRecap.map((s, idx) => ({
        no: idx + 1,
        nama: s.name,
        kelas: s.class_name,
        hadir: s.hadir,
        tidakHadir: s.tidak_hadir,
        izin: s.izin,
        sakit: s.sakit,
        uzur: s.uzur,
        persentase: `${s.percentage}%`,
      }));

      exportRecapToExcel(
        'Laporan Absensi Solat Siswa',
        {
          sekolah: 'SMP/SMA Islam Terpadu',
          kelas: className,
          periode: `${startDate} s/d ${endDate}`,
          totalSiswa: studentRecap.length,
        },
        exportData,
        `rekap-absen-solat-${startDate}-${endDate}.xlsx`
      );
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (isExportDisabled) return;
    setIsExporting(true);
    try {
      const className = selectedClassId && selectedClassId !== 'all'
        ? classes.find((c) => c.id === Number(selectedClassId))?.name || 'Semua Kelas'
        : 'Semua Kelas';

      const exportData = studentRecap.map((s, idx) => ({
        no: idx + 1,
        nama: s.name,
        kelas: s.class_name,
        hadir: s.hadir,
        tidakHadir: s.tidak_hadir,
        izin: s.izin,
        sakit: s.sakit,
        uzur: s.uzur,
        persentase: `${s.percentage}%`,
      }));

      exportRecapToPDF(
        'Laporan Absensi Solat Murid',
        {
          sekolah: schoolName || 'Sekolah',
          kelas: className,
          periode: `${startDate} s/d ${endDate}`,
          totalSiswa: studentRecap.length,
        },
        exportData,
        `rekap-absen-solat-${startDate}-${endDate}.pdf`
      );
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor file PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Rekapitulasi Absensi"
        subtitle="Buat laporan kehadiran murid"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters Panel (Langsung di Halaman Tanpa Kartu) */}
        <section className="space-y-4 print:hidden font-outfit">
          {/* Quick Period Tabs & Judul dengan Ilustrasi Printer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pb-3.5 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <img
                src="/assets/aistudio/printer_78349_4b0f0477.png"
                alt="Printer"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0"
              />
              <div>
                <h2 className="font-outfit font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-snug">
                  Pilihan Periode Ekspor
                </h2>
              </div>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-4 gap-1 border border-slate-200 text-xs font-bold w-full sm:w-auto font-outfit">
              <button
                type="button"
                onClick={() => handlePeriodChange('day')}
                className={`font-outfit px-2.5 sm:px-3 py-1.5 rounded-lg text-center flex items-center justify-center tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  periodType === 'day' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('week')}
                className={`font-outfit px-2.5 sm:px-3 py-1.5 rounded-lg text-center flex items-center justify-center tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  periodType === 'week' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Minggu Ini
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('month')}
                className={`font-outfit px-2.5 sm:px-3 py-1.5 rounded-lg text-center flex items-center justify-center tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  periodType === 'month' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`font-outfit px-2.5 sm:px-3 py-1.5 rounded-lg text-center flex items-center justify-center tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  periodType === 'custom' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Kustom
              </button>
            </div>
          </div>

          {/* Status Indikator Kesiapan Ekspor (Diletakkan di bawah pilih hari bulan dll) */}
          <div className="flex items-center justify-between text-xs font-outfit px-1 print:hidden">
            <div className="flex items-center gap-2">
              {isExportDisabled ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="font-medium">{getExportStatusMessage()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold">{getExportStatusMessage()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between">
              <label className="font-outfit block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span className="font-outfit flex items-center gap-1.5 font-bold tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Mulai
                </span>
                {periodType !== 'custom' && (
                  <span className="font-outfit text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                    otomatis
                  </span>
                )}
              </label>
              <input
                type="date"
                value={startDate}
                disabled={periodType !== 'custom'}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodType('custom');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200 transition-all font-outfit"
              />
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between">
              <label className="font-outfit block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span className="font-outfit flex items-center gap-1.5 font-bold tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Akhir
                </span>
                {periodType !== 'custom' && (
                  <span className="font-outfit text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                    otomatis
                  </span>
                )}
              </label>
              <input
                type="date"
                value={endDate}
                disabled={periodType !== 'custom'}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodType('custom');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200 transition-all font-outfit"
              />
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between">
              <label className="font-outfit block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Filter Kelas
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all font-outfit"
              >
                <option value="">-- Pilih Kelas --</option>
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between">
              <label className="font-outfit block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Filter Solat
              </label>
              <select
                value={selectedPrayerId}
                onChange={(e) => setSelectedPrayerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all font-outfit"
              >
                <option value="">Semua Solat (Sesuai Pengaturan)</option>
                {prayers.filter((p) => p.is_active === 1).map((p) => (
                  <option key={p.id} value={p.id}>
                    Solat {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between">
              <label className="font-outfit block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Murid Spesifik
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all font-outfit"
              >
                <option value="">Semua Murid</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>



        {/* Action Ekspor di luar kartu, berukuran panjang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 print:hidden">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportDisabled}
            className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2.5 font-outfit ${
              isExportDisabled
                ? 'bg-slate-200 text-slate-400 border border-slate-300/80 cursor-not-allowed shadow-none select-none'
                : 'bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white cursor-pointer border border-emerald-950/40 shadow-emerald-950/25 ring-1 ring-white/15'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 shrink-0" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportDisabled}
            className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2.5 font-outfit ${
              isExportDisabled
                ? 'bg-slate-200 text-slate-400 border border-slate-300/80 cursor-not-allowed shadow-none select-none'
                : 'bg-gradient-to-r from-[#063826] via-[#082d30] to-[#1e3a8a] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white cursor-pointer border border-emerald-950/40 shadow-emerald-950/25 ring-1 ring-white/15'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Ekspor PDF (.pdf)</span>
          </button>
        </div>

        {/* Printable Official Header (Shown during Print) */}
        <div className="hidden print:block p-4 border-b-2 border-slate-900 text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">LAPORAN REKAPITULASI ABSENSI SOLAT MURID</h2>
          <p className="text-sm">Sekolah: SMP / SMA Islam Terpadu Digital</p>
          <p className="text-xs text-slate-600">
            Periode: {startDate} s/d {endDate} • Dicetak: {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>

      </div>
    </div>
  );
};
