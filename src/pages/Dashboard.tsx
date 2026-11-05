import React, { useState, useEffect } from 'react';
import {
  Bell,
  User,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HeartPulse,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { DashboardStats } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AppLogo } from '../components/AppLogo.tsx';
import { StudentDetailModal } from '../components/StudentDetailModal.tsx';

interface DashboardProps {
  onNavigate: (path: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // Tanggal lokal hari ini yang akurat tanpa pergeseran zona waktu UTC
  const getTodayLocalDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getTodayLocalDate();
  });
  const todayDate = getTodayLocalDate();
  const isToday = selectedDate >= todayDate;
  const [isLoading, setIsLoading] = useState(true);
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

  // Jumlah notifikasi yang belum dibaca (unread count)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const fetchUnreadStatus = async () => {
    try {
      const res = await api.getUnreadAnnouncementsCount();
      setUnreadNotificationsCount(res.unreadCount || 0);
    } catch {
      // Fallback lokal
      try {
        const saved = localStorage.getItem('sias_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUnreadNotificationsCount(parsed.filter((n: any) => !n.isRead).length);
            return;
          }
        }
      } catch {
        // ignore
      }
      setUnreadNotificationsCount(0);
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

  // Ambil data statistik dari backend
  const fetchStats = async (date: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats(date);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedDate);
  }, [selectedDate]);

  // Fungsi navigasi mundur 1 hari secara lokal akurat
  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    current.setDate(current.getDate() - 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Fungsi navigasi maju 1 hari secara lokal akurat (dibatasi maksimal hari ini)
  const handleNextDay = () => {
    if (selectedDate >= todayDate) return;
    const parts = selectedDate.split('-');
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    current.setDate(current.getDate() + 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const nextDate = `${year}-${month}-${day}`;
    if (nextDate > todayDate) return;
    setSelectedDate(nextDate);
  };

  // Format tanggal dalam bahasa Indonesia, misal: "Kamis, 15 Okt 2026"
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return dateStr;
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const dayName = dayNames[d.getDay()];
      const dayNum = d.getDate();
      const monthName = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Hitung persentase kehadiran hari ini
  const todayTotal = stats?.today?.total || 0;
  const hadirCount = stats?.today?.hadir || 0;
  const izinCount = stats?.today?.izin || 0;
  const sakitCount = stats?.today?.sakit || 0;
  const alfaCount = stats?.today?.tidakHadir || 0;

  const hadirPct = todayTotal > 0 ? Math.round((hadirCount / todayTotal) * 100) : 0;
  const izinPct = todayTotal > 0 ? Math.round((izinCount / todayTotal) * 100) : 0;
  const sakitPct = todayTotal > 0 ? Math.round((sakitCount / todayTotal) * 100) : 0;
  const alfaPct = todayTotal > 0 ? Math.round((alfaCount / todayTotal) * 100) : 0;

  // Data Kelas riil dari backend statistik
  const classItems = (stats?.classStats || []).map((c) => ({
    name: c.class_name,
    hadirText: `${c.hadir} hadir dari ${c.total} jadwal presensi`,
    percentage: c.percentage,
    borderColor: c.percentage >= 85 ? 'border-[#6ee7b7]' : c.percentage >= 70 ? 'border-[#fde68a]' : 'border-[#fecdd3]',
    ringColor: c.percentage >= 85 ? '#059669' : c.percentage >= 70 ? '#d97706' : '#e11d48',
  }));

  // Data Murid Memerlukan Perhatian dari backend
  const attentionStudents = (stats?.lowAttendanceStudents || []).map((s: any) => {
    const reasons: string[] = [];
    if (s.tidak_hadir > 0) reasons.push(`${s.tidak_hadir}x Alfa`);
    if (s.izin > 0) reasons.push(`${s.izin}x Izin`);
    if (s.sakit > 0) reasons.push(`${s.sakit}x Sakit`);
    const reasonText = reasons.length > 0 ? reasons.join(' • ') : `${s.percentage}%`;

    return {
      id: s.id,
      name: s.name,
      className: s.class_name,
      score: `${s.percentage}%`,
      reason: reasonText,
      hasAlfa: (s.tidak_hadir || 0) > 0,
      tidakHadir: s.tidak_hadir || 0,
      izin: s.izin || 0,
      sakit: s.sakit || 0,
    };
  });

  const teacherName = user?.name || 'Guru';
  const isFirstLoad = isLoading && !stats;

  return (
    <div className="min-h-screen bg-[#f0f4f2] text-slate-800">
      {/* ======================================================== */}
      {/* 1. HERO HEADER (PERPADUAN HIJAU GELAP & BIRU GELAP NAVIGASI) */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-b from-[#063826] via-[#082a2b] to-[#0f172a] text-white px-5 pt-3.5 sm:pt-4 pb-8 rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        {/* Dekorasi Cahaya Halus */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto">
          {/* Top Bar: SIAS Branding & Notifikasi/Profil */}
          <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b-2 border-emerald-400/40">
            {/* Logo & Judul Aplikasi */}
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

            {/* Tombol Notifikasi & Profil */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => onNavigate('/notifications')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer shadow-xs relative"
                title="Notifikasi & Pemberitahuan"
                aria-label="Notifikasi & Pemberitahuan"
              >
                <img
                  src="/assets/aistudio/megaphone_icon_184829_a5ed886a.png"
                  alt="Notifikasi & Pemberitahuan"
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain brightness-0 invert"
                />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-[#063826] shadow-xs animate-in zoom-in-50 duration-200">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/profile')}
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

          {/* Sapaan Pengguna & Ilustrasi Hero */}
          <div className="mt-4 flex items-center justify-between">
            {/* Teks Sapaan */}
            {isFirstLoad ? (
              <div className="space-y-2 py-1">
                <div className="h-8 sm:h-9 w-44 sm:w-56 rounded-xl shimmer-dark" />
                <div className="h-3.5 sm:h-4 w-52 sm:w-64 rounded-lg shimmer-dark" />
                <div className="h-3 sm:h-3.5 w-36 sm:w-48 rounded-lg shimmer-dark" />
              </div>
            ) : (
              <div className="transition-opacity duration-300 animate-in fade-in-50">
                <h2 className="inline font-outfit text-2xl sm:text-3xl font-black text-white leading-tight">
                  Halo,{' '}
                </h2>
                <p className="inline font-outfit text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {teacherName}
                </p>
                <p className="block font-jakarta text-emerald-100/90 text-xs sm:text-[13px] font-normal tracking-wide max-w-[215px] sm:max-w-xs leading-relaxed pt-1 antialiased">
                  lakukan absensi solat hari ini dan lihat laporan dengan cepat.
                </p>
              </div>
            )}

            {/* Ilustrasi Vektor Time Management: Clipboard, Jam 3D, Kalender Spiral & Pensil (Tanpa Background) */}
            <div className="relative shrink-0 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center select-none">
              {/* Bayangan Lantai Lembut */}
              <div className="absolute -bottom-1 w-32 sm:w-40 h-3.5 bg-black/40 rounded-full blur-xs pointer-events-none" />

              <svg
                viewBox="0 0 320 320"
                className="w-full h-full select-none animate-float-gentle drop-shadow-xl"
                style={{
                  filter: 'drop-shadow(0 16px 20px rgba(0, 0, 0, 0.45)) drop-shadow(0 6px 8px rgba(0, 0, 0, 0.3))',
                }}
                fill="none"
              >
                {/* 1. KALENDER MEJA SPIRAL (DI BELAKANG KANAN) */}
                <g transform="rotate(22, 235, 185)">
                  {/* Bayangan Kalender */}
                  <rect
                    x="184"
                    y="108"
                    width="84"
                    height="112"
                    rx="10"
                    fill="#0f2416"
                  />
                  {/* Badan Kalender Hijau */}
                  <rect
                    x="178"
                    y="102"
                    width="84"
                    height="112"
                    rx="10"
                    fill="#2e9e62"
                    stroke="#14261a"
                    strokeWidth="3.5"
                  />

                  {/* Kawat Spiral Atas (3 Ring Putih) */}
                  <path
                    d="M 194 104 C 194 91 204 91 204 104"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 214 104 C 214 91 224 91 224 104"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 234 104 C 234 91 244 91 244 104"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Grid Tanggal Kalender (4 Kolom x 4 Baris) */}
                  {/* Baris 1 */}
                  <rect x="187" y="118" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="204" y="118" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="221" y="118" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="238" y="118" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />

                  {/* Baris 2 */}
                  <rect x="187" y="135" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="204" y="135" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="221" y="135" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  {/* Kotak dengan Tanda X Silang 1 */}
                  <rect x="238" y="135" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <path d="M 240 137 L 249 146 M 249 137 L 240 146" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Baris 3 */}
                  <rect x="187" y="152" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  {/* Kotak dengan Tanda X Silang 2 */}
                  <rect x="204" y="152" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <path d="M 206 154 L 215 163 M 215 154 L 206 163" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="221" y="152" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="238" y="152" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />

                  {/* Baris 4 */}
                  <rect x="187" y="169" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="204" y="169" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="221" y="169" width="13" height="13" rx="2" fill="#ffffff" stroke="#14261a" strokeWidth="1.5" />
                  <rect x="238" y="169" width="13" height="13" rx="2" fill="#6bc08b" stroke="#14261a" strokeWidth="1.5" />
                </g>

                {/* 2. PAPAN CLIPBOARD UTAMA */}
                <g transform="rotate(-6, 150, 160)">
                  {/* Bayangan Tebal Clipboard Bawah/Kanan */}
                  <rect
                    x="76"
                    y="60"
                    width="170"
                    height="218"
                    rx="14"
                    fill="#14261a"
                  />
                  {/* Papan Utama Clipboard (Hijau Muda Segar) */}
                  <rect
                    x="70"
                    y="54"
                    width="170"
                    height="218"
                    rx="14"
                    fill="#66be87"
                    stroke="#14261a"
                    strokeWidth="3.5"
                  />

                  {/* Jepitan Klip Hijau Tua di Atas */}
                  <path
                    d="M 116 56 C 120 40 132 28 155 28 C 178 28 190 40 194 56 Z"
                    fill="#2e9e62"
                    stroke="#14261a"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Lubang Lingkaran di Klip */}
                  <circle
                    cx="155"
                    cy="40"
                    r="5.5"
                    fill="#074732"
                    stroke="#14261a"
                    strokeWidth="2.5"
                  />

                  {/* Lembaran Kertas Putih */}
                  <rect
                    x="82"
                    y="68"
                    width="146"
                    height="192"
                    rx="8"
                    fill="#ffffff"
                    stroke="#14261a"
                    strokeWidth="2.5"
                  />

                  {/* Item 1: Kotak Centang 1 (Hijau + Centang Hitam) */}
                  <rect
                    x="96"
                    y="88"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#74c798"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  <path
                    d="M 100 98 L 105 103 L 114 91"
                    stroke="#14261a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Garis Catatan 1 */}
                  <line x1="126" y1="95" x2="168" y2="95" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="174" y1="95" x2="198" y2="95" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="126" y1="104" x2="158" y2="104" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />

                  {/* Item 2: Kotak Centang 2 (Hijau + Centang Hitam) */}
                  <rect
                    x="96"
                    y="122"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#74c798"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  <path
                    d="M 100 132 L 105 137 L 114 125"
                    stroke="#14261a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Garis Catatan 2 */}
                  <line x1="126" y1="129" x2="154" y2="129" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="160" y1="129" x2="194" y2="129" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="126" y1="138" x2="166" y2="138" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />

                  {/* Item 3: Kotak Kosong 3 */}
                  <rect
                    x="96"
                    y="156"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#8fd7ad"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  {/* Garis Catatan 3 */}
                  <line x1="126" y1="163" x2="178" y2="163" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="126" y1="172" x2="160" y2="172" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />

                  {/* Item 4: Kotak Kosong 4 */}
                  <rect
                    x="96"
                    y="190"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#8fd7ad"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  {/* Garis Catatan 4 */}
                  <line x1="126" y1="197" x2="162" y2="197" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="126" y1="206" x2="184" y2="206" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* 3. JAM ANALOG 3D (KIRI ATAS) */}
                <g>
                  {/* Sisi Ketebalan 3D Tabung Jam Hijau Tua */}
                  <path
                    d="M 36 68 C 24 84 26 106 42 118 C 56 128 76 126 90 114 L 84 100 C 74 110 58 112 46 104 C 34 94 32 78 42 66 Z"
                    fill="#2e9e62"
                    stroke="#14261a"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Muka Jam Depan (Hijau Mint Terang) */}
                  <circle
                    cx="58"
                    cy="86"
                    r="34"
                    fill="#8cd6a9"
                    stroke="#14261a"
                    strokeWidth="3.5"
                  />

                  {/* 12 Garis Indikator Jam di Sekeliling Muka Jam */}
                  <line x1="58" y1="56" x2="58" y2="61" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="73" y1="60" x2="71" y2="64" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="84" y1="71" x2="80" y2="73" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="88" y1="86" x2="83" y2="86" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="84" y1="101" x2="80" y2="99" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="73" y1="112" x2="71" y2="108" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="58" y1="116" x2="58" y2="111" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="43" y1="112" x2="45" y2="108" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="32" y1="101" x2="36" y2="99" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="28" y1="86" x2="33" y2="86" stroke="#14261a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="32" y1="71" x2="36" y2="73" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="43" y1="60" x2="45" y2="64" stroke="#14261a" strokeWidth="2" strokeLinecap="round" />

                  {/* Jarum Jam Hitam (Pukul ~10:10) */}
                  <circle cx="58" cy="86" r="3" fill="#14261a" />
                  <line
                    x1="58"
                    y1="86"
                    x2="40"
                    y2="76"
                    stroke="#14261a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="58"
                    y1="86"
                    x2="62"
                    y2="60"
                    stroke="#14261a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>

                {/* 4. PENSIL HIJAU (KIRI BAWAH) */}
                <g transform="rotate(32, 60, 220)">
                  {/* Ujung Penghapus Bulat */}
                  <path
                    d="M 52 148 C 52 142 62 142 62 148 Z"
                    fill="#6bc08b"
                    stroke="#14261a"
                    strokeWidth="2.5"
                  />
                  {/* Cincin Logam Putih Ferrule */}
                  <rect
                    x="52"
                    y="148"
                    width="10"
                    height="6"
                    fill="#ffffff"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  {/* Batang Pensil Hijau */}
                  <rect
                    x="52"
                    y="154"
                    width="10"
                    height="90"
                    rx="1.5"
                    fill="#2e9e62"
                    stroke="#14261a"
                    strokeWidth="2.5"
                  />
                  {/* Kerucut Kayu Pensil Diraut */}
                  <polygon
                    points="52,244 62,244 57,260"
                    fill="#ffffff"
                    stroke="#14261a"
                    strokeWidth="2"
                  />
                  {/* Ujung Mata Pensil Hitam */}
                  <polygon
                    points="55,255 59,255 57,262"
                    fill="#14261a"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. BODY KONTEN DASBOR (TAMPILAN HALAMAN PENUH TANPA KARTU) */}
      {/* ======================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-28">

        {/* ---------------------------------------------------- */}
        {/* SEKSI 1: RINGKASAN ABSENSI HARI INI */}
        {/* ---------------------------------------------------- */}
        <section className="space-y-4">
          {/* Header Seksi & Kontrol Tanggal */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
            <div>
              <h2 className="flex items-center gap-2 font-poppins font-black text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                <img
                  src="/assets/aistudio/ic_today_128_28815_39063a0f.png"
                  alt="Ringkasan Harian"
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                />
                <span>Ringkasan Absensi Hari Ini</span>
              </h2>
            </div>

            {/* Baris Pemilih Tanggal */}
            <div className="flex items-center space-x-2">
              {/* Tombol Panah Kiri (<) */}
              <button
                type="button"
                onClick={handlePrevDay}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>

              {/* Pill Tanggal */}
              <div className="relative">
                <div className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-2 shadow-2xs">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {formatIndonesianDate(selectedDate)}
                  </span>
                </div>
                {/* Input tanggal tak terlihat untuk memilih tanggal kustom jika diklik (maksimal hari ini) */}
                <input
                  type="date"
                  max={todayDate}
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setSelectedDate(val > todayDate ? todayDate : val);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Pilih tanggal"
                />
              </div>

              {/* Tombol Panah Kanan (>) - aktif saat ada hari berikutnya, nonaktif jika sudah hari ini */}
              <button
                type="button"
                onClick={handleNextDay}
                disabled={isToday}
                aria-disabled={isToday}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  isToday
                    ? 'bg-slate-100/70 text-slate-300 cursor-not-allowed opacity-40'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                }`}
                title={isToday ? 'Sudah mencapai hari ini' : 'Hari Berikutnya'}
              >
                <ChevronRight className="w-5 h-5 text-current" />
              </button>
            </div>
          </div>

          {/* Grid 4 Status (Hadir, Izin, Sakit, Alfa / Absen) */}
          {isFirstLoad ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-22 sm:h-24"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-12 rounded-md shimmer-light" />
                    <div className="w-4 h-4 rounded-full shimmer-light" />
                  </div>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <div className="h-7 w-12 rounded-lg shimmer-light" />
                    <div className="h-4 w-10 rounded-md shimmer-light" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-300 animate-in fade-in-50">
              {/* 1. Hadir */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col justify-between h-22 sm:h-24">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-[11px] sm:text-xs tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Hadir
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="font-outfit text-2xl sm:text-[26px] font-black text-slate-900 leading-none">
                    {hadirCount}
                  </span>
                  <span className="font-outfit text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {hadirPct}%
                  </span>
                </div>
              </div>

              {/* 2. Izin */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col justify-between h-22 sm:h-24">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-[11px] sm:text-xs tracking-wider uppercase text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    Izin
                  </span>
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="font-outfit text-2xl sm:text-[26px] font-black text-slate-900 leading-none">
                    {izinCount}
                  </span>
                  <span className="font-outfit text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {izinPct}%
                  </span>
                </div>
              </div>

              {/* 3. Sakit */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col justify-between h-22 sm:h-24">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-[11px] sm:text-xs tracking-wider uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Sakit
                  </span>
                  <HeartPulse className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="font-outfit text-2xl sm:text-[26px] font-black text-slate-900 leading-none">
                    {sakitCount}
                  </span>
                  <span className="font-outfit text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    {sakitPct}%
                  </span>
                </div>
              </div>

              {/* 4. Alfa / Absen */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col justify-between h-22 sm:h-24">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-[11px] sm:text-xs tracking-wider uppercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Alfa
                  </span>
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="font-outfit text-2xl sm:text-[26px] font-black text-slate-900 leading-none">
                    {alfaCount}
                  </span>
                  <span className="font-outfit text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    {alfaPct}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* DUA KOLOM: REKAP KELAS & MURID MEMERLUKAN PERHATIAN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* ---------------------------------------------------- */}
          {/* SEKSI 2: RINGKASAN KEHADIRAN SETIAP KELAS */}
          {/* ---------------------------------------------------- */}
          <section className="space-y-4">
            {/* Judul Seksi */}
            <div className="pb-3.5 border-b border-slate-200">
              <h2 className="flex items-center gap-2 font-poppins font-black text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                <img
                  src="/assets/aistudio/chart-3_111422_c864aed4.png"
                  alt="Ringkasan Kehadiran Kelas"
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                />
                <span>Ringkasan Kehadiran Setiap Kelas</span>
              </h2>
            </div>

            {/* Daftar Kelas */}
            {isFirstLoad ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 sm:p-3.5 bg-white border border-slate-200/90 flex items-center justify-between shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 sm:w-28 rounded-md shimmer-light" />
                      <div className="h-3 w-36 sm:w-44 rounded-md shimmer-light" />
                    </div>
                    <div className="w-11 h-11 rounded-full shimmer-light shrink-0" />
                  </div>
                ))}
              </div>
            ) : classItems.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-slate-50/80 via-slate-50/60 to-slate-100/50 border border-slate-200/80 flex flex-col items-center justify-center transition-opacity duration-300 animate-in fade-in-50">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="clsBgGlow" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f0fdf4" />
                        <stop offset="1" stopColor="#e0f2fe" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="url(#clsBgGlow)" />
                    <circle cx="50" cy="50" r="35" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    
                    {/* Decorative desk/class board */}
                    <rect x="28" y="26" width="44" height="32" rx="4" fill="#047857" />
                    <rect x="31" y="29" width="38" height="26" rx="2" fill="#065f46" />
                    <line x1="36" y1="38" x2="52" y2="38" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="36" y1="44" x2="64" y2="44" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    <line x1="36" y1="49" x2="48" y2="49" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    
                    {/* Stand legs */}
                    <path d="M42 58L36 74" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M58 58L64 74" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M50 58V72" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                    
                    {/* Mini badge */}
                    <circle cx="72" cy="30" r="6" fill="#f59e0b" />
                    <path d="M72 26L73 28.5L75.5 29.5L73 30.5L72 33L71 30.5L68.5 29.5L71 28.5Z" fill="#ffffff" />
                  </svg>
                </div>
                <p className="font-jakarta text-xs sm:text-[13px] font-bold text-slate-800">
                  Belum Ada Data Kelas
                </p>
                <p className="font-outfit text-[11px] text-slate-500 max-w-xs mt-0.5 leading-relaxed">
                  Daftar kelas dan jadwal presensi belum tersimpan di sistem.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/classes')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  <span>+ Tambah Data Kelas</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 transition-opacity duration-300 animate-in fade-in-50">
                {classItems.map((cls, idx) => {
                  const radius = 17;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (cls.percentage / 100) * circumference;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 sm:p-3.5 bg-white border ${cls.borderColor} flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow`}
                    >
                      <div>
                        <h3 className="font-outfit font-black text-sm text-slate-900 tracking-tight">
                          {cls.name}
                        </h3>
                        <p className="font-jakarta text-[11.5px] text-slate-500 font-medium tracking-tight mt-0.5">
                          {cls.hadirText}
                        </p>
                      </div>

                      {/* Ring Donut Persentase */}
                      <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                        <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 42 42">
                          <circle
                            cx="21"
                            cy="21"
                            r={radius}
                            fill="transparent"
                            stroke="#f1f5f9"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="21"
                            cy="21"
                            r={radius}
                            fill="transparent"
                            stroke={cls.ringColor}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="font-outfit absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                          {cls.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------------------------------------------------- */}
          {/* SEKSI 3: MURID MEMERLUKAN PERHATIAN */}
          {/* ---------------------------------------------------- */}
          <section className="space-y-4">
            {/* Judul Seksi */}
            <div className="pb-3.5 border-b border-slate-200">
              <h2 className="flex items-center gap-2 font-poppins font-black text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                <img
                  src="/assets/aistudio/alert_danger_warning_notification_icon_124692_d050f8ad.png"
                  alt="Murid Memerlukan Perhatian"
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                />
                <span>Murid Memerlukan Perhatian</span>
              </h2>
            </div>

            {/* Daftar Murid Perlu Perhatian */}
            {isFirstLoad ? (
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/90 p-2 sm:p-3 shadow-2xs">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-2.5 first:pt-1 last:pb-1 px-2 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 sm:w-36 rounded-md shimmer-light" />
                      <div className="h-3 w-16 sm:w-20 rounded-md shimmer-light" />
                    </div>
                    <div className="h-6 w-20 sm:w-24 rounded-lg shimmer-light shrink-0" />
                  </div>
                ))}
              </div>
            ) : attentionStudents.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-emerald-50/40 via-slate-50/60 to-slate-50 border border-emerald-100/60 flex flex-col items-center justify-center transition-opacity duration-300 animate-in fade-in-50">
                {/* Ilustrasi Vektor Status Aman & Terkendali */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="attBgGlow" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ecfdf5" />
                        <stop offset="1" stopColor="#d1fae5" />
                      </linearGradient>
                      <linearGradient id="attShield" x1="40" y1="30" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10b981" />
                        <stop offset="1" stopColor="#047857" />
                      </linearGradient>
                    </defs>

                    {/* Halo lingkar lembut */}
                    <circle cx="60" cy="60" r="48" fill="url(#attBgGlow)" />
                    <circle cx="60" cy="60" r="40" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

                    {/* Ornamen bintang & kilau */}
                    <path d="M92 34L93.5 39L98.5 40.5L93.5 42L92 47L90.5 42L85.5 40.5L90.5 39Z" fill="#f59e0b" />
                    <path d="M28 78L29 82L33 83L29 84L28 88L27 84L23 83L27 82Z" fill="#10b981" opacity="0.8" />
                    <circle cx="28" cy="38" r="2.5" fill="#34d399" opacity="0.6" />
                    <circle cx="94" cy="84" r="2.5" fill="#fbbf24" opacity="0.8" />

                    {/* Perisai Utama */}
                    <path
                      d="M60 28C74 28 86 35 86 35V62C86 77 75 89 60 95C45 89 34 77 34 62V35C34 35 46 28 60 28Z"
                      fill="url(#attShield)"
                    />
                    {/* Kilau garis dalam perisai */}
                    <path
                      d="M60 32C72 32 82 38 82 38V61C82 73 72 84 60 89C48 84 38 73 38 61V38C38 38 48 32 60 32Z"
                      stroke="#ffffff"
                      strokeOpacity="0.3"
                      strokeWidth="1.2"
                      fill="none"
                    />
                    {/* Tanda Centang */}
                    <path
                      d="M51 61L57 67L70 53"
                      stroke="#ffffff"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Mini badge status 'Tertib' */}
                    <rect x="70" y="70" width="30" height="14" rx="7" fill="#ffffff" stroke="#d1fae5" strokeWidth="1" />
                    <circle cx="76" cy="77" r="2.5" fill="#10b981" />
                    <text x="82" y="80" fontSize="6.5" fontWeight="bold" fill="#047857" fontFamily="sans-serif">AMAN</text>
                  </svg>
                </div>

                <p className="font-jakarta text-xs sm:text-[13px] font-bold text-slate-800">
                  Alhamdulillah, Semua Murid Terkendali
                </p>
                <p className="font-outfit text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Tidak ada murid yang memerlukan perhatian khusus saat ini. Seluruh presensi tercatat tertib.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-2xs transition-opacity duration-300 animate-in fade-in-50">
                {attentionStudents.map((st, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 first:pt-1 last:pb-1 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (st.id) {
                            setDetailStudentId(st.id);
                          } else {
                            onNavigate('/students', { search: st.name });
                          }
                        }}
                        className="font-jakarta font-extrabold text-[13px] text-slate-900 hover:text-emerald-700 hover:underline decoration-emerald-500 underline-offset-2 leading-tight text-left cursor-pointer transition-colors block"
                        title="Klik untuk melihat rincian capaian murid"
                      >
                        {st.name}
                      </button>
                      <span className="font-outfit text-[11px] text-slate-500 font-semibold tracking-wide block mt-0.5">
                        {st.className}
                      </span>
                    </div>

                    {/* Alasan absensi rendah: jumlah kali Alfa atau Izin/Sakit */}
                    <span
                      className={`font-outfit text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 border ${
                        st.hasAlfa
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}
                      title={`Nilai Kehadiran: ${st.score}`}
                    >
                      {st.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </main>

      {/* Modal Rincian Murid & Statistik Kehadiran */}
      <StudentDetailModal
        studentId={detailStudentId}
        isOpen={!!detailStudentId}
        onClose={() => setDetailStudentId(null)}
      />
    </div>
  );
};
