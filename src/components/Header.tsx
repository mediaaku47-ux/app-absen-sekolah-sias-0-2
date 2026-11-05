import { useState, useEffect } from 'react';
import { Bell, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AppLogo } from './AppLogo.tsx';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  overlappingCard?: React.ReactNode;
  searchElement?: React.ReactNode;
  bottomElement?: React.ReactNode;
  showGreeting?: boolean;
  schoolName?: string;
  systemTitle?: string;
  onNavigate?: (path: string, params?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  overlappingCard,
  searchElement,
  bottomElement,
  showGreeting,
  schoolName,
  systemTitle,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadStatus = async () => {
    try {
      const res = await api.getUnreadAnnouncementsCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      try {
        const saved = localStorage.getItem('sias_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUnreadCount(parsed.filter((n: any) => !n.isRead).length);
            return;
          }
        }
      } catch {
        // ignore
      }
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadStatus();

    window.addEventListener('storage', fetchUnreadStatus);
    window.addEventListener('focus', fetchUnreadStatus);
    window.addEventListener('notifications-updated', fetchUnreadStatus);
    return () => {
      window.removeEventListener('storage', fetchUnreadStatus);
      window.removeEventListener('focus', fetchUnreadStatus);
      window.removeEventListener('notifications-updated', fetchUnreadStatus);
    };
  }, []);

  const isGreetingActive = showGreeting ?? !!searchElement;
  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('/dashboard');
    } else {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/dashboard' } }));
    }
  };

  return (
    <div className="w-full relative">
      {/* Kartu Header Utama Seragam dengan Dasbor: Perpaduan Hijau Gelap & Biru Gelap Navigasi */}
      <div
        className={`bg-gradient-to-b from-[#063826] via-[#082a2b] to-[#0f172a] rounded-b-[2rem] sm:rounded-b-[2.5rem] px-5 sm:px-7 pt-4 sm:pt-5 ${
          overlappingCard ? 'pb-14 sm:pb-20' : 'pb-6 sm:pb-8'
        } text-white shadow-md relative overflow-hidden`}
      >
        {/* Dekorasi Cahaya Halus */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-md sm:max-w-xl mx-auto w-full">
          {/* Bagian Atas Kartu: Identitas App & Notifikasi/Profil Seragam */}
          <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b-2 border-emerald-400/40 -mx-5 sm:-mx-7 px-5 sm:px-7">
            {/* Logo & Judul Aplikasi Konsisten 100% */}
            <div className="flex items-center space-x-2.5">
              <AppLogo className="w-10 h-10 shadow-md rounded-2xl ring-2 ring-emerald-400/30 shrink-0" />
              <div>
                <h1 className="font-outfit font-black text-base sm:text-lg tracking-wider leading-tight bg-gradient-to-r from-white via-sky-200 to-emerald-300 bg-clip-text text-transparent inline-block">
                  SIAS
                </h1>
                <p className="font-outfit text-[10px] sm:text-[11px] text-emerald-100/90 font-semibold tracking-wide leading-tight mt-0.5">
                  Sistem Informasi Absensi Solat
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Lonceng Notifikasi & Profil Pengguna Seragam 100% dengan Beranda */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/notifications') : window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/notifications' } }))}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer shadow-xs relative"
                title="Notifikasi & Pemberitahuan"
                aria-label="Notifikasi & Pemberitahuan"
              >
                <img
                  src="/assets/aistudio/megaphone_icon_184829_a5ed886a.png"
                  alt="Notifikasi & Pemberitahuan"
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain brightness-0 invert"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-[#063826] shadow-xs animate-in zoom-in-50 duration-200">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/profile') : window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/profile' } }))}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                title="Profil Guru & Pengguna"
                aria-label="Profil Guru & Pengguna"
              >
                <img
                  src="/assets/aistudio/ui_user_profile_avatar_person_icon_208734_53544997.png"
                  alt="Profil Guru & Pengguna"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain brightness-0 invert scale-[1.2]"
                />
              </button>
            </div>
          </div>

          {/* Bagian Bawah Kartu: Judul Halaman & Konten Spesifik */}
          <div className="mt-4">
            {isGreetingActive ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={handleBackToDashboard}
                      className="w-8 h-8 rounded-full border border-emerald-400/30 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                      title="Kembali ke Dasbor"
                      aria-label="Kembali ke Dasbor"
                    >
                      <ArrowLeft className="w-4.5 h-4.5 text-white" />
                    </button>
                    <h2 className="flex flex-wrap items-baseline gap-2">
                      <span className="font-outfit text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                        Halo,
                      </span>
                      <span className="font-outfit text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                        {user?.name || 'Guru'}
                      </span>
                    </h2>
                  </div>

                  {actions && <div className="shrink-0">{actions}</div>}
                </div>

                {searchElement && <div className="w-full">{searchElement}</div>}
                {bottomElement && <div className="w-full">{bottomElement}</div>}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Tanda Panah Kembali ke Halaman Awal Dasbor (Tanpa Teks) */}
                  <button
                    type="button"
                    onClick={handleBackToDashboard}
                    className="w-8 h-8 rounded-full border border-emerald-400/30 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                    title="Kembali ke Dasbor"
                    aria-label="Kembali ke Dasbor"
                  >
                    <ArrowLeft className="w-4.5 h-4.5 text-white" />
                  </button>

                  <div className="min-w-0">
                    {title && (
                      <h2 className="font-outfit font-black text-xl sm:text-2xl tracking-tight text-white leading-tight truncate">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="font-jakarta text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5 leading-snug">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kartu Kecil Menimpa (Overlapping Card) */}
      {overlappingCard && (
        <div className="max-w-md sm:max-w-xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-20">
          <div className="bg-white rounded-2xl py-2.5 px-3.5 shadow-md shadow-slate-900/5 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2.5 transition-all">
            {overlappingCard}
          </div>
        </div>
      )}
    </div>
  );
};
