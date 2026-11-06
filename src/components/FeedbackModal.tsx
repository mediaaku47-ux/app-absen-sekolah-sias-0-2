import React, { useState, useEffect } from 'react';
import { Star, X, Send, Heart, CheckCircle2, Loader2, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const FeedbackModal: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer 24 Jam & Pemeriksaan status dari localStorage
  useEffect(() => {
    // 1. Simpan waktu kunjungan pertama jika belum pernah tersimpan
    const firstSeen = localStorage.getItem('sias_first_seen_time');
    const now = Date.now();
    if (!firstSeen) {
      localStorage.setItem('sias_first_seen_time', String(now));
      return;
    }

    // 2. Jika sudah pernah kirim penilaian, jangan tampilkan lagi
    const alreadySubmitted = localStorage.getItem('sias_feedback_submitted');
    if (alreadySubmitted === 'true') {
      return;
    }

    // 3. Jika pengguna memilih "Nanti Saja", cek batas waktu tunda
    const dismissedUntil = localStorage.getItem('sias_feedback_dismissed_until');
    if (dismissedUntil && now < Number(dismissedUntil)) {
      return;
    }

    // 4. Hitung apakah sudah 24 jam sejak pertama kali aktif
    const elapsed = now - Number(firstSeen);
    if (elapsed >= ONE_DAY_MS) {
      // Tampilkan popup secara mulus setelah 1.5 detik agar tidak mengagetkan
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Event listener agar popup penilaian dapat dibuka manual (misal via tombol Pengaturan / Profil / Admin)
  useEffect(() => {
    const handleOpenModal = () => {
      setIsSubmitted(false);
      setRating(0);
      setFeedbackText('');
      setErrorMessage(null);
      setIsOpen(true);
    };

    window.addEventListener('open-feedback-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-feedback-modal', handleOpenModal);
    };
  }, []);

  const handleClose = () => {
    // Jika ditutup tanpa kirim penilaian, ingatkan kembali dalam 24 jam ke depan
    if (!isSubmitted) {
      localStorage.setItem('sias_feedback_dismissed_until', String(Date.now() + ONE_DAY_MS));
    }
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Silakan pilih salah satu bintang penilaian (1 s/d 5 bintang)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.submitFeedback({
        rating,
        feedback: feedbackText.trim() || undefined,
        userName: user?.name || user?.username || 'Pengguna SIAS',
        userEmail: user?.email || undefined,
      });

      // Tandai di localStorage bahwa pengguna sudah memberikan penilaian agar tidak muncul berulang
      localStorage.setItem('sias_feedback_submitted', 'true');
      setIsSubmitted(true);

      // Tutup otomatis setelah 2.2 detik tampilan ucapan terima kasih
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setRating(0);
        setFeedbackText('');
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim penilaian. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;

  // Label deskripsi bintang
  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Sangat Perlu Ditingkatkan';
      case 2:
        return 'Kurang Memuaskan';
      case 3:
        return 'Cukup Baik & Bermanfaat';
      case 4:
        return 'Bagus & Sangat Membantu';
      case 5:
        return 'Luar Biasa & Sangat Memuaskan! ⭐';
      default:
        return 'Klik bintang untuk memberi nilai';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {/* Tombol Silang (X) di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Tutup pop-up penilaian"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          /* ======================================================== */
          /* TAMPILAN TERIMA KASIH SETELAH DIKIRIM (MANIS & OTOMATIS TUTUP) */
          /* ======================================================== */
          <div className="p-8 sm:p-9 text-center space-y-4 animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-100/60">
              <CheckCircle2 className="w-9 h-9 animate-bounce text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-outfit font-black text-xl text-slate-900 tracking-tight">
                Terima kasih atas masukan berharga Anda!
              </h3>
              <p className="font-jakarta text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Penilaian dan saran Anda telah tersimpan dan akan sangat membantu tim SIAS dalam mengevaluasi serta mengembangkan aplikasi.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/90 py-2 px-3 rounded-xl border border-emerald-100/80">
              <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
              <span>Semoga hari Anda menyenangkan</span>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* FORMULIR PENILAIAN BINTANG & KOTAK SARAN */
          /* ======================================================== */
          <div className="p-6 sm:p-7">
            {/* Header / Ilustrasi */}
            <div className="text-center space-y-2 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-100 via-amber-50 to-emerald-50 text-amber-500 flex items-center justify-center mx-auto shadow-sm ring-4 ring-amber-100/50">
                <MessageSquareHeart className="w-7 h-7 text-amber-500" />
              </div>

              <div>
                <h3 id="feedback-title" className="font-poppins font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
                  Bagaimana pengalaman Anda menggunakan SIAS?
                </h3>
                <p className="font-jakarta text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Bantu kami menjadi lebih baik dengan memberikan penilaian dan saran.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center font-jakarta animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sistem Rating 1 s/d 5 Bintang */}
              <div className="flex flex-col items-center justify-center space-y-2 py-1">
                <div
                  className="flex items-center space-x-2 sm:space-x-2.5"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= currentDisplayRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => {
                          setRating(starVal);
                          setErrorMessage(null);
                        }}
                        onMouseEnter={() => setHoverRating(starVal)}
                        className="p-1 rounded-lg hover:scale-115 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                        title={`${starVal} Bintang`}
                        aria-label={`Beri ${starVal} Bintang`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-slate-100 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Deskripsi Teks Rating */}
                <div className="min-h-5 flex items-center justify-center">
                  <span
                    className={`font-poppins text-xs font-bold transition-all duration-200 ${
                      rating > 0 ? 'text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs' : 'text-slate-400 font-medium'
                    }`}
                  >
                    {getRatingLabel(currentDisplayRating)}
                  </span>
                </div>
              </div>

              {/* Kotak Masukan (Textarea Saran Opsional) */}
              <div className="space-y-1.5">
                <label className="font-poppins block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Masukan & Saran <span className="text-slate-400 font-normal lowercase font-jakarta">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tuliskan masukan, kritik, atau ide fitur baru seputar aplikasi SIAS..."
                  maxLength={500}
                  className="font-jakarta w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none shadow-2xs leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-slate-400 px-1 font-medium font-jakarta">
                  <span className="font-jakarta">Masukan Anda akan diterima langsung oleh pengelola</span>
                  <span className="font-jakarta font-semibold">{feedbackText.length}/500</span>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-poppins font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] transition-all shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan Penilaian...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Penilaian</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer"
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
