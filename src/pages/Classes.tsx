import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ClassItem, AcademicYear } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { Modal } from '../components/Modal.tsx';
import { PageLoader } from '../components/PageLoader.tsx';

export const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('7');
  const [formAcademicYearId, setFormAcademicYearId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, ayList] = await Promise.all([api.getClasses(), api.getAcademicYears()]);
      setClasses(cList);
      setAcademicYears(ayList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setFormName('');
    setFormGrade('7');
    const activeAy = academicYears.find((ay) => ay.is_active === 1);
    setFormAcademicYearId(activeAy ? activeAy.id : academicYears[0]?.id || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setFormName(c.name);
    setFormGrade(c.grade);
    setFormAcademicYearId(c.academic_year_id || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formGrade) {
      setFormError('Nama kelas dan tingkat wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          name: formName.trim(),
          grade: formGrade,
          academic_year_id: formAcademicYearId ? Number(formAcademicYearId) : null,
        });
      } else {
        await api.createClass({
          name: formName.trim(),
          grade: formGrade,
          academic_year_id: formAcademicYearId ? Number(formAcademicYearId) : null,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data kelas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteClass(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kelas');
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Kelola Data Kelas"
        actions={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <PageLoader message="memuat halaman" />
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Belum ada kelas terdaftar</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Tambah Kelas" untuk menambahkan rombel baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-end mb-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{cls.name}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Tahun Ajaran: <strong>{cls.academic_year_name || '2026/2027'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{cls.student_count || 0} Siswa Aktif</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Tersinkron</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: VII A, VIII B, atau X MIPA 1"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tingkat
              </label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="1">Kelas 1 (SD)</option>
                <option value="2">Kelas 2 (SD)</option>
                <option value="3">Kelas 3 (SD)</option>
                <option value="4">Kelas 4 (SD)</option>
                <option value="5">Kelas 5 (SD)</option>
                <option value="6">Kelas 6 (SD)</option>
                <option value="7">Kelas 7 (SMP)</option>
                <option value="8">Kelas 8 (SMP)</option>
                <option value="9">Kelas 9 (SMP)</option>
                <option value="10">Kelas 10 (SMA / SMK)</option>
                <option value="11">Kelas 11 (SMA / SMK)</option>
                <option value="12">Kelas 12 (SMA / SMK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tahun Ajaran
              </label>
              <select
                value={formAcademicYearId}
                onChange={(e) => setFormAcademicYearId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kelas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Kelas"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus kelas{' '}
            <strong className="text-slate-900">{deleteTarget?.name}</strong>?
          </p>
          {deleteTarget && (deleteTarget.student_count || 0) > 0 && (
            <p className="text-xs text-rose-600">
              Peringatan: Kelas ini masih memiliki {deleteTarget.student_count} siswa aktif. Harap
              pindahkan atau hapus siswa terlebih dahulu.
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteClass}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
