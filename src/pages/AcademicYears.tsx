import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AcademicYear } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { Modal } from '../components/Modal.tsx';
import { PageLoader } from '../components/PageLoader.tsx';

export const AcademicYears: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formName, setFormName] = useState('2026/2027');
  const [formSemester, setFormSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await api.getAcademicYears();
      setAcademicYears(list);
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
    setEditingYear(null);
    setFormName('2026/2027');
    setFormSemester('Ganjil');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ay: AcademicYear) => {
    setEditingYear(ay);
    setFormName(ay.name);
    setFormSemester(ay.semester);
    setFormIsActive(ay.is_active === 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSetActive = async (ay: AcademicYear) => {
    try {
      await api.updateAcademicYear(ay.id, { is_active: 1 });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah tahun ajaran aktif');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama tahun ajaran wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingYear) {
        await api.updateAcademicYear(editingYear.id, {
          name: formName.trim(),
          semester: formSemester,
          is_active: formIsActive ? 1 : 0,
        });
      } else {
        await api.createAcademicYear({
          name: formName.trim(),
          semester: formSemester,
          is_active: formIsActive,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan tahun ajaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteAcademicYear(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Tahun Ajaran & Semester"
        subtitle="Kelola kalender akademik aktif untuk mengaitkan rombel kelas dan absensi"
        actions={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daftar Tahun Ajaran Sekolah</span>
          </div>

          {isLoading ? (
            <PageLoader message="memuat halaman" />
          ) : (
            <div className="divide-y divide-slate-100">
              {academicYears.map((ay) => {
                const isActive = ay.is_active === 1;
                return (
                  <div
                    key={ay.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-800">
                            Tahun Ajaran {ay.name} — Semester {ay.semester}
                          </h4>
                          {isActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Sedang Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Status: {isActive ? 'Periode Berjalan' : 'Arsip/Nonaktif'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(ay)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Jadikan Aktif
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(ay)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {!isActive && (
                        <button
                          onClick={() => setDeleteTarget(ay)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: 2026/2027"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Semester
            </label>
            <select
              value={formSemester}
              onChange={(e) => setFormSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="ayActiveCheck"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="ayActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Atur sebagai tahun ajaran yang sedang aktif
            </label>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Tahun Ajaran"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Hapus tahun ajaran{' '}
            <strong className="text-slate-900">
              {deleteTarget?.name} ({deleteTarget?.semester})
            </strong>
            ?
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
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
