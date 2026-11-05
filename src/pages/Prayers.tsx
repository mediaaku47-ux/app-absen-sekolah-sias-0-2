import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { PrayerType } from '../types.ts';
import { Header } from '../components/Header.tsx';
import { Modal } from '../components/Modal.tsx';
import { PageLoader } from '../components/PageLoader.tsx';

export const Prayers: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerType | null>(null);
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await api.getPrayerTypes();
      setPrayers(list);
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
    setEditingPrayer(null);
    setFormName('');
    setFormSortOrder(prayers.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: PrayerType) => {
    setEditingPrayer(p);
    setFormName(p.name);
    setFormSortOrder(p.sort_order);
    setFormIsActive(p.is_active === 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (p: PrayerType) => {
    try {
      await api.updatePrayerType(p.id, {
        is_active: p.is_active === 1 ? 0 : 1,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status jenis solat');
    }
  };

  const handleSavePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama jenis solat wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingPrayer) {
        await api.updatePrayerType(editingPrayer.id, {
          name: formName.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive ? 1 : 0,
        });
      } else {
        await api.createPrayerType({
          name: formName.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan jenis solat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Pengaturan Jenis Solat"
        subtitle="Sesuaikan jenis solat yang dipantau (Subuh, Zuhur, Asar, Maghrib, Isya, Dhuha, dll)"
        actions={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Solat</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Info card */}
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs sm:text-sm flex items-start space-x-3">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Fleksibilitas Aturan Sekolah</p>
            <p className="text-xs text-teal-700 mt-0.5">
              Setiap sekolah dapat memiliki aturan solat yang berbeda. Jika sekolah Anda hanya mewajibkan absen solat Zuhur dan Asar di sekolah, nonaktifkan solat lainnya agar tidak muncul di form absen harian guru.
            </p>
          </div>
        </div>

        {/* Prayer list */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daftar Waktu Solat Terdaftar</span>
          </div>

          {isLoading ? (
            <PageLoader message="memuat halaman" />
          ) : (
            <div className="divide-y divide-slate-100">
              {prayers.map((prayer) => {
                const isActive = prayer.is_active === 1;
                return (
                  <div
                    key={prayer.id}
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
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-800">
                            Solat {prayer.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isActive ? 'Aktif Digunakan' : 'Dinonaktifkan'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Urutan Tampilan: #{prayer.sort_order}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(prayer)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                          isActive
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Nonaktifkan</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aktifkan</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(prayer)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Jenis Solat"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Prayer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPrayer ? 'Edit Jenis Solat' : 'Tambah Jenis Solat'}
      >
        <form onSubmit={handleSavePrayer} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Jenis Solat
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Subuh, Zuhur, Asar, Dhuha"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Urutan Waktu
            </label>
            <input
              type="number"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(Number(e.target.value))}
              min={1}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Aktifkan untuk absensi sekolah saat ini
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Jenis Solat'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
