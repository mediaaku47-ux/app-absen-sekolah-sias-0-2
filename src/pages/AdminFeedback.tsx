import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquareHeart,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Award,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { FeedbackItem, FeedbackSummaryResponse } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminFeedbackProps {
  onNavigate: (path: string) => void;
}

export const AdminFeedback: React.FC<AdminFeedbackProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<FeedbackSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFeedbacks();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus penilaian ini secara permanen?')) return;
    setDeletingId(id);
    try {
      await api.deleteFeedback(id);
      setData((prev) => {
        if (!prev) return null;
        const updated = prev.feedbacks.filter((f) => f.id !== id);
        const total = updated.length;
        let sum = 0;
        const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        updated.forEach((f) => {
          sum += f.rating;
          counts[f.rating] = (counts[f.rating] || 0) + 1;
        });
        return {
          total,
          averageRating: total > 0 ? Number((sum / total).toFixed(1)) : 0,
          ratingCounts: counts,
          feedbacks: updated,
        };
      });
      setFeedbackNotice('Penilaian berhasil dihapus.');
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus penilaian');
    } finally {
      setDeletingId(null);
    }
  };

  // Format tanggal dalam bahasa Indonesia
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Filter daftar masukan
  const filteredFeedbacks = (data?.feedbacks || []).filter((item) => {
    // Filter bintang
    if (selectedFilter === '5' && item.rating !== 5) return false;
    if (selectedFilter === '4' && item.rating !== 4) return false;
    if (selectedFilter === '3' && item.rating !== 3) return false;
    if (selectedFilter === 'critical' && (item.rating > 2)) return false;

    // Filter teks pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.user_name.toLowerCase().includes(q);
      const matchEmail = (item.user_email || '').toLowerCase().includes(q);
      const matchText = (item.feedback || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchText) return false;
    }

    return true;
  });

  const total = data?.total || 0;
  const avg = data?.averageRating || 0;
  const satisfiedCount = (data?.ratingCounts[5] || 0) + (data?.ratingCounts[4] || 0);
  const satisfiedPct = total > 0 ? Math.round((satisfiedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f1f5f3] text-slate-800 pb-20">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#063826] via-[#094230] to-[#0f172a] text-white px-5 sm:px-8 pt-6 pb-12 shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center space-x-1.5 text-emerald-200 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-feedback-modal'))}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Coba buka popup modal penilaian"
            >
              <Eye className="w-4 h-4" />
              <span>Pratinjau Pop-up Penilaian</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Panel Evaluasi Administrator</span>
              </div>
              <h1 className="font-outfit font-black text-2xl sm:text-3xl text-white tracking-tight">
                Penilaian & Masukan Pengguna
              </h1>
              <p className="font-jakarta text-xs sm:text-sm text-emerald-100/90 max-w-xl">
                Pantau rating bintang, saran pengembangan, dan ulasan dari pengguna aplikasi SIAS untuk bahan evaluasi berkala.
              </p>
            </div>

            <button
              onClick={fetchFeedbacks}
              disabled={isLoading}
              className="self-start sm:self-auto flex items-center space-x-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-all border border-white/15 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 space-y-6">
        {feedbackNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs animate-in fade-in">
            {feedbackNotice}
          </div>
        )}

        {/* ======================================================== */}
        {/* STATISTIK RINGKASAN EVALUASI & DISTRIBUSI BINTANG */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Rata-rata Skor Bintang */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="font-outfit text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Rata-rata Penilaian
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="font-outfit text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
                {avg}
              </span>
              <span className="text-slate-400 text-sm font-bold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4.5 h-4.5 ${
                    i <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 font-medium ml-1.5">
                ({total} ulasan)
              </span>
            </div>
          </div>

          {/* Card 2: Kepuasan Pengguna */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="font-outfit text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Tingkat Kepuasan
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="font-outfit text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight leading-none">
                {satisfiedPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{satisfiedCount} dari {total} pengguna memberi bintang 4 atau 5</span>
            </div>
          </div>

          {/* Card 3: Distribusi Bintang 1-5 */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs space-y-1.5">
            <span className="font-outfit text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              Distribusi Bintang
            </span>
            {[5, 4, 3, 2, 1].map((s) => {
              const count = data?.ratingCounts[s] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-7 font-bold text-slate-700 flex items-center gap-0.5">
                    {s} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] font-bold text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* FILTER & PENCARIAN */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({total})
            </button>
            <button
              onClick={() => setSelectedFilter('5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === '5'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>5 Bintang</span>
              <span className="text-[10px] opacity-80">({data?.ratingCounts[5] || 0})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === '4'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>4 Bintang</span>
              <span className="text-[10px] opacity-80">({data?.ratingCounts[4] || 0})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === '3'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>3 Bintang</span>
              <span className="text-[10px] opacity-80">({data?.ratingCounts[3] || 0})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>Perlu Evaluasi (1-2★)</span>
              <span className="text-[10px] opacity-80">
                ({(data?.ratingCounts[1] || 0) + (data?.ratingCounts[2] || 0)})
              </span>
            </button>
          </div>

          {/* Kotak Pencarian */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, atau isi saran..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* DAFTAR ULASAN DARI PENGGUNA */}
        {/* ======================================================== */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Memuat data masukan pengguna...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-800">
                Belum ada masukan yang cocok
              </h3>
              <p className="font-jakarta text-xs text-slate-500 max-w-sm mx-auto">
                {total === 0
                  ? 'Pengguna yang aktif selama 24 jam akan otomatis menerima pop-up penilaian. Anda juga dapat mencoba menekan tombol "Pratinjau Pop-up Penilaian" di atas.'
                  : 'Coba ubah filter atau kata kunci pencarian Anda.'}
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-xs">
                      {item.user_name.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-outfit font-extrabold text-sm sm:text-base text-slate-900">
                          {item.user_name}
                        </h4>
                        {item.user_role && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {item.user_role}
                          </span>
                        )}
                      </div>
                      <p className="font-jakarta text-xs text-slate-500">
                        {item.user_email || 'Email tidak dilampirkan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {/* Bintang */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-amber-800 ml-1">
                        {item.rating}.0
                      </span>
                    </div>

                    {/* Waktu */}
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatDate(item.created_at)}
                    </span>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus penilaian ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Konten Ulasan / Saran */}
                <div>
                  {item.feedback ? (
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                      "{item.feedback}"
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Pengguna hanya memberikan rating bintang tanpa catatan teks tambahan.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
