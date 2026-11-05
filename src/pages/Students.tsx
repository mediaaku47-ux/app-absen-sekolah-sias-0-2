import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  GraduationCap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Student, ClassItem } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { Modal } from '../components/Modal.tsx';
import { PageLoader } from '../components/PageLoader.tsx';

interface StudentsProps {
  onViewStudentDetail?: (studentId: number) => void;
  initialParams?: { search?: string; classId?: string; studentId?: number };
}

export const Students: React.FC<StudentsProps> = ({ onViewStudentDetail, initialParams }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialParams?.classId || '');
  const [search, setSearch] = useState<string>(initialParams?.search || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialParams?.search) {
      setSearch(initialParams.search);
    }
    if (initialParams?.classId !== undefined) {
      setSelectedClassId(initialParams.classId);
    }
    if (initialParams?.studentId) {
      viewDetail(initialParams.studentId);
    }
  }, [initialParams]);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formClassId, setFormClassId] = useState<number | ''>('');
  const [formIsActive, setFormIsActive] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  // Detail Modal
  const [studentDetail, setStudentDetail] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, sList] = await Promise.all([
        api.getClasses(),
        api.getStudents({
          class_id: selectedClassId || undefined,
          search: search || undefined,
        }),
      ]);
      setClasses(cList);
      setStudents(sList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedClassId, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormGender('L');
    setFormClassId(classes.length > 0 ? classes[0].id : '');
    setFormIsActive(1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormGender(s.gender);
    setFormClassId(s.class_id);
    setFormIsActive(s.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClassId) {
      setFormError('Harap lengkapi semua kolom');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          name: formName.trim(),
          gender: formGender,
          class_id: Number(formClassId),
          is_active: formIsActive,
        });
      } else {
        await api.createStudent({
          name: formName.trim(),
          gender: formGender,
          class_id: Number(formClassId),
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus siswa');
    }
  };

  const viewDetail = async (studentId: number) => {
    try {
      const res = await api.getStudentDetail(studentId);
      setStudentDetail(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-100/70 min-h-screen">
      <Header
        title="Informasi Data Murid"
        subtitle="Pantau kehadiran setiap murid"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-5">
        {/* Tombol Tambah Murid di Paling Atas (Di Atas Kelas) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={openAddModal}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-poppins font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span>Tambah Murid</span>
          </button>
        </div>

        {/* Filter Kelas dan Pencarian Murid (Tanpa Tombol Cari Manual) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 ring-1 ring-slate-900/5 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_10px_20px_-3px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-72">
            <label className="font-outfit text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Pilih Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-jakarta"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Tingkat {c.grade})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:max-w-md">
            <label className="font-outfit text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-jakarta"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 ring-1 ring-slate-900/5 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_12px_24px_-4px_rgba(15,23,42,0.06),0_24px_48px_-8px_rgba(15,23,42,0.03)] p-4 sm:p-5">
          <div className="pb-3 mb-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-outfit text-xs text-slate-500 font-medium">
              Total <strong className="font-outfit font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">{students.length}</strong> murid terdaftar
            </span>
          </div>

          {isLoading ? (
            <PageLoader message="memuat halaman" />
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 font-outfit">Tidak ada data siswa ditemukan</p>
            </div>
          ) : (
            <div className="bg-slate-100/70 p-3 sm:p-4 rounded-2xl border border-slate-200/90">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {students.map((student, idx) => (
                  <div
                    key={student.id}
                    onClick={() => viewDetail(student.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        viewDetail(student.id);
                      }
                    }}
                    className="bg-white hover:bg-emerald-50/30 border-2 border-slate-300/90 hover:border-emerald-500 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-150 shadow-xs hover:shadow-md group cursor-pointer"
                    title={`Klik untuk melihat detail kehadiran ${student.name}`}
                  >
                  {/* Baris 1: 3 awal jadi satu baris (Nomor agak besar, Nama Murid, dan LP) */}
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Nomor: seperti 1. agak besar dan jelas dilihat */}
                    <span className="font-outfit font-extrabold text-base sm:text-lg text-emerald-950 shrink-0 leading-none">
                      {idx + 1}.
                    </span>

                    {/* Nama Murid (bisa diklik untuk melihat rincian kehadiran) */}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-lexend font-bold text-slate-900 group-hover:text-emerald-700 group-hover:underline decoration-emerald-500 underline-offset-2 text-xs sm:text-[13.5px] block truncate transition-colors leading-tight tracking-tight">
                        {student.name}
                      </span>
                    </div>

                    {/* L / P Badge */}
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-outfit font-black ${
                        student.gender === 'L'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-pink-50 text-pink-800 border border-pink-200'
                      }`}
                      title={`Jenis Kelamin: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`}
                    >
                      {student.gender === 'L' ? 'L' : 'P'}
                    </span>
                  </div>

                  {/* Baris 2: Kelas & Aksi (Edit & Sampah) */}
                  <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-outfit bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold px-2 py-0.5 rounded-md truncate max-w-[120px] tracking-wide"
                        title={`Kelas: ${student.class_name || '-'}`}
                      >
                        {student.class_name || '-'}
                      </span>
                      {student.is_active === 0 && (
                        <span className="font-outfit text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded font-medium shrink-0">
                          Nonaktif
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(student);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Data Murid"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(student);
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Murid (Sampah)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Ahmad Fauzi"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kelas</label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editingStudent && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={formIsActive}
                onChange={(e) => setFormIsActive(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={1}>Aktif</option>
                <option value={0}>Nonaktif (Keluar/Pindah)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Siswa"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus data siswa{' '}
            <strong className="text-slate-900">{deleteTarget?.name}</strong>?
          </p>
          <p className="text-xs text-rose-600">
            Perhatian: Seluruh riwayat absensi siswa ini juga akan ikut terhapus.
          </p>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={!!studentDetail}
        onClose={() => setStudentDetail(null)}
        title="Detail Siswa & Statistik"
        maxWidth="max-w-2xl"
      >
        {studentDetail && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base text-slate-800">
                  {studentDetail.student.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Kelas: {studentDetail.student.class_name} •{' '}
                  {studentDetail.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {studentDetail.summary.percentage}%
                </span>
                <span className="block text-[10px] text-slate-400">Kehadiran</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-gradient-to-b from-emerald-50 to-emerald-100/70 border border-emerald-300 border-b-2 border-b-emerald-500 rounded-xl shadow-2xs">
                <span className="font-extrabold text-[10px] sm:text-xs text-emerald-800 uppercase tracking-wide">Hadir</span>
                <p className="font-black text-emerald-950 text-sm sm:text-base mt-0.5">
                  {studentDetail.summary.hadir}
                </p>
              </div>
              <div className="p-2 bg-gradient-to-b from-rose-50 to-rose-100/70 border border-rose-300 border-b-2 border-b-rose-500 rounded-xl shadow-2xs">
                <span className="font-extrabold text-[10px] sm:text-xs text-rose-800 uppercase tracking-wide">Alfa</span>
                <p className="font-black text-rose-950 text-sm sm:text-base mt-0.5">
                  {studentDetail.summary.tidakHadir}
                </p>
              </div>
              <div className="p-2 bg-gradient-to-b from-blue-50 to-blue-100/70 border border-blue-300 border-b-2 border-b-blue-500 rounded-xl shadow-2xs">
                <span className="font-extrabold text-[10px] sm:text-xs text-blue-800 uppercase tracking-wide">Izin</span>
                <p className="font-black text-blue-950 text-sm sm:text-base mt-0.5">
                  {studentDetail.summary.izin}
                </p>
              </div>
              <div className="p-2 bg-gradient-to-b from-amber-50 to-amber-100/70 border border-amber-300 border-b-2 border-b-amber-500 rounded-xl shadow-2xs">
                <span className="font-extrabold text-[10px] sm:text-xs text-amber-800 uppercase tracking-wide">Sakit</span>
                <p className="font-black text-amber-950 text-sm sm:text-base mt-0.5">
                  {studentDetail.summary.sakit}
                </p>
              </div>
              <div className="p-2 bg-gradient-to-b from-purple-50 to-purple-100/70 border border-purple-300 border-b-2 border-b-purple-500 rounded-xl shadow-2xs">
                <span className="font-extrabold text-[10px] sm:text-xs text-purple-800 uppercase tracking-wide">Uzur</span>
                <p className="font-black text-purple-950 text-sm sm:text-base mt-0.5">
                  {studentDetail.summary.uzur}
                </p>
              </div>
            </div>

            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mt-4">
              Riwayat 15 Absensi Terakhir
            </h5>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3">Solat</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentDetail.history.slice(0, 15).map((h: any) => (
                    <tr key={h.id}>
                      <td className="py-2 px-3">{h.attendance_date}</td>
                      <td className="py-2 px-3 font-semibold">{h.prayer_name}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            h.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.status === 'Tidak Hadir'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 italic">{h.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  const s = studentDetail.student;
                  setStudentDetail(null);
                  openEditModal(s);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Data Siswa</span>
              </button>
              <button
                onClick={() => setStudentDetail(null)}
                className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/20 ring-1 ring-white/15 cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
