import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  Megaphone,
  Plus,
  X,
  Send,
  AlertTriangle,
  Calendar,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AnnouncementItem } from '../types.ts';

interface NotificationsProps {
  onNavigate: (path: string, params?: any) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  // Akun kamal atau peran admin adalah pemilik/pengelola seluruh aplikasi SIAS
  const isMasterAdmin = user?.username?.toLowerCase() === 'kamal' || user?.role === 'admin';

  // Hapus semua data notifikasi mock/lokal agar halaman benar-benar bersih
  useEffect(() => {
    try {
      localStorage.removeItem('sias_notifications');
      window.dispatchEvent(new Event('notifications-updated'));
    } catch {
      // ignore
    }
  }, []);

  // Pengumuman siaran seluruh pengguna dari database server
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal buat pengumuman baru (Khusus akun Kamal / Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Konfirmasi hapus pemberitahuan (Aktif tanpa window.confirm yang terblokir)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Muat pengumuman resmi dari database
  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res.announcements || []);
      // Ketika dibuka dan dibaca, trigger update agar angka notifikasi di navbar dan dasbor menghilang
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error('Gagal mengambil pengumuman:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Eksekusi hapus pemberitahuan
  const confirmDeleteAnnouncement = async () => {
    if (deleteConfirmId === null) return;
    const id = deleteConfirmId;
    setIsDeleting(true);
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      window.dispatchEvent(new Event('notifications-updated'));
      setSuccessToast('Pemberitahuan berhasil dihapus.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus pemberitahuan');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Kirim pengumuman baru ke seluruh pengguna SIAS
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('Judul dan isi pengumuman wajib diisi.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await api.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
      });

      if (res.announcement) {
        setAnnouncements((prev) => [res.announcement, ...prev]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewContent('');
        window.dispatchEvent(new Event('notifications-updated'));
        setSuccessToast('Pengumuman berhasil disiarkan ke seluruh pengguna SIAS!');
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyiarkan pengumuman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements;

  const formatAnnouncementDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f3] text-slate-800 pb-20 lg:pb-12 font-outfit">
      {/* Toast Notifikasi Sukses */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/50 flex items-center space-x-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Toast Notifikasi Error */}
      {errorMessage && (
        <div className="fixed top-5 right-5 z-50 bg-rose-900 text-white px-4 py-3 rounded-xl shadow-xl border border-rose-500/50 flex items-center space-x-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#063826] via-[#0b4835] to-[#0f172a] text-white px-5 sm:px-8 pt-6 pb-8 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center space-x-1.5 text-emerald-200 hover:text-white transition-colors cursor-pointer text-sm font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                <Megaphone className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Pengumuman SIAS
                </h1>
                <p className="text-emerald-200/90 text-xs sm:text-sm mt-0.5">
                  Pusat informasi dan siaran pengumuman resmi seluruh pengguna
                </p>
              </div>
            </div>

            {/* Tombol Buat Pengumuman untuk Akun Kamal / Admin */}
            {isMasterAdmin && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 ring-2 ring-amber-300/80"
                  title="Buat dan siarkan pengumuman ke seluruh pengguna aplikasi SIAS"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Buat Pengumuman Baru</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Konten Utama - diletakkan di halaman putih tanpa ditarik ke atas */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Daftar Pengumuman Resmi */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Memuat data pengumuman...</p>
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                  Daftar Pengumuman Resmi
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {filteredAnnouncements.length} Pengumuman
                </span>
              </div>

              {filteredAnnouncements.map((item) => (
                <div
                  key={`announcement-${item.id}`}
                  className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Jenis / Judul Pemberitahuan */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      {/* Tanggal Pemberitahuan & Indikator Jumlah Pengguna yang Sudah Melihat (Khusus Admin) */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1.5 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatAnnouncementDate(item.created_at)}</span>
                        </div>

                        {isMasterAdmin && (
                          <div
                            className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                            title={`Sebanyak ${item.views_count ?? 0} pengguna telah melihat pemberitahuan ini`}
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Dilihat oleh {item.views_count ?? 0} pengguna</span>
                          </div>
                        )}
                      </div>

                      {/* Isi Pemberitahuan */}
                      <p className="text-xs sm:text-sm text-slate-700 mt-2.5 leading-relaxed whitespace-pre-line font-normal">
                        {item.content}
                      </p>
                    </div>

                    {/* Tombol Hapus Pemberitahuan - Khusus Admin/Kamal, tidak bisa dihapus oleh pengguna biasa */}
                    {isMasterAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        className="p-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs hover:shadow-md active:scale-95 flex items-center justify-center group/btn"
                        title="Hapus pemberitahuan ini (Khusus Admin)"
                        aria-label="Hapus pemberitahuan"
                      >
                        <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Kondisi Kosong Bersih - Tidak Ada Data Uji Coba Bawaan */
            <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs">
                <Megaphone className="w-8 h-8 text-emerald-600 opacity-80" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Belum Ada Pemberitahuan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                {isMasterAdmin
                  ? 'Semua data telah dibersihkan. Halaman ini akan tetap kosong sampai Anda membuat pemberitahuan baru untuk seluruh pengguna SIAS.'
                  : 'Belum ada pemberitahuan dari pengelola SIAS.'}
              </p>
              {isMasterAdmin && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pemberitahuan Baru</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL BUAT PENGUMUMAN BARU (KHUSUS AKUN KAMAL / ADMIN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-outfit animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    Buat Pemberitahuan Baru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pemberitahuan akan langsung tampil untuk seluruh pengguna SIAS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Jenis / Judul Pemberitahuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis / Judul Pemberitahuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya atau Jadwal Khusus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-outfit"
                />
              </div>

              {/* Isi Pemberitahuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Pemberitahuan
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan isi pemberitahuan di sini..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-outfit leading-relaxed"
                />
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white transition-all cursor-pointer shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pemberitahuan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PEMBERITAHUAN */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-outfit animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Hapus Pemberitahuan?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Pemberitahuan ini akan dihapus dari sistem SIAS. Apakah Anda yakin ingin melanjutkannya?
            </p>
            <div className="flex items-center space-x-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteAnnouncement}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
