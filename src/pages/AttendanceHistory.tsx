import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  GraduationCap,
  Clock,
  Search,
  Filter,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  HeartPulse,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ClassItem, PrayerType, AttendanceHistoryRecord, AttendanceStatus } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { Modal } from '../components/Modal.tsx';
import { PageLoader } from '../components/PageLoader.tsx';
import { StudentDetailModal } from '../components/StudentDetailModal.tsx';

interface AttendanceHistoryProps {
  initialParams?: { search?: string; classId?: string };
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ initialParams }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [prayers, setPrayers] = useState<PrayerType[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState<string>(initialParams?.classId || '');
  const [prayerId, setPrayerId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>(initialParams?.search || '');

  useEffect(() => {
    if (initialParams?.search) {
      setSearch(initialParams.search);
    }
  }, [initialParams]);

  const [records, setRecords] = useState<AttendanceHistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceHistoryRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Hadir');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Student Detail Modal State
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cList, pList] = await Promise.all([api.getClasses(), api.getPrayerTypes()]);
        setClasses(cList);
        const activePrayers = pList.filter((p) => p.is_active === 1);
        setPrayers(activePrayers);
        setPrayerId((prev) => {
          if (!prev) return '';
          return activePrayers.some((p) => String(p.id) === String(prev)) ? prev : '';
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

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAttendanceHistory({
        startDate,
        endDate,
        class_id: classId || undefined,
        prayer_type_id: prayerId || undefined,
        status: status || undefined,
        search: search || undefined,
        limit: 100,
      });
      setRecords(data.records);
      setTotalCount(data.total);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat absensi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, classId, prayerId, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const openEditModal = (rec: AttendanceHistoryRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditNotes(rec.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      await api.updateSingleAttendance(editingRecord.id, editStatus, editNotes);
      setEditingRecord(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Riwayat Absensi Solat"
        subtitle="Telusuri seluruh catatan absensi terdahulu dengan pencarian dan filter mendalam"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Tanggal Mulai */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Tanggal Akhir */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Kelas
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Solat */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Jenis Solat
              </label>
              <select
                value={prayerId}
                onChange={(e) => setPrayerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Solat (Sesuai Pengaturan)</option>
                {prayers.filter((p) => p.is_active === 1).map((p) => (
                  <option key={p.id} value={p.id}>
                    Solat {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Status Kehadiran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir (Alfa)</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Uzur">Uzur / Haid</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-950/25 ring-1 ring-white/15 transition-all cursor-pointer"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={fetchRecords}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 cursor-pointer"
              title="Segarkan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan <span className="font-bold text-slate-800">{records.length}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalCount}</span> catatan
            </span>
          </div>

          {isLoading ? (
            <PageLoader message="memuat halaman" />
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Tidak ada riwayat absensi yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-3.5">Tanggal</th>
                    <th className="py-3 px-3.5">Solat</th>
                    <th className="py-3 px-3.5">Siswa</th>
                    <th className="py-3 px-3.5">Kelas</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5">Catatan</th>
                    <th className="py-3 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => {
                    const isHadir = rec.status === 'Hadir';
                    const isAlfa = rec.status === 'Tidak Hadir';
                    const isIzin = rec.status === 'Izin';
                    const isSakit = rec.status === 'Sakit';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                          {new Date(rec.attendance_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-800">{rec.prayer_name}</td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => setDetailStudentId(rec.student_id)}
                            className="font-semibold text-slate-800 hover:text-emerald-700 hover:underline decoration-emerald-500 underline-offset-2 transition-colors text-left cursor-pointer"
                            title="Klik untuk melihat rincian murid"
                          >
                            {rec.student_name}
                          </button>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">{rec.class_name}</td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              isHadir
                                ? 'bg-emerald-100 text-emerald-800'
                                : isAlfa
                                ? 'bg-rose-100 text-rose-800'
                                : isIzin
                                ? 'bg-amber-100 text-amber-800'
                                : isSakit
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 text-xs italic">
                          {rec.notes || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Status"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Attendance Record Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="Edit Status Kehadiran Siswa"
      >
        {editingRecord && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>
                <span className="text-slate-400">Siswa:</span>{' '}
                <span className="font-bold text-slate-800">{editingRecord.student_name}</span>
              </p>
              <p>
                <span className="text-slate-400">Kelas / Solat:</span>{' '}
                <span className="font-medium text-slate-700">
                  {editingRecord.class_name} — Solat {editingRecord.prayer_name}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Tanggal:</span>{' '}
                <span className="font-medium text-slate-700">{editingRecord.attendance_date}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Status Kehadiran
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Hadir', 'Tidak Hadir', 'Izin', 'Sakit', 'Uzur'] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEditStatus(st)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editStatus === st
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'Tidak Hadir' ? 'Alfa' : st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Keterangan / Catatan
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Contoh: Sakit demam / Haid / Izin keluarga"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-5 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Rincian Murid & Statistik Kehadiran */}
      <StudentDetailModal
        studentId={detailStudentId}
        isOpen={!!detailStudentId}
        onClose={() => setDetailStudentId(null)}
      />
    </div>
  );
};
