import React, { useState, useEffect } from 'react';
import {
  History,
  Users,
  GraduationCap,
  Clock,
  CalendarDays,
  Settings,
  LogOut,
  Sparkles,
  Award,
  MessageSquareHeart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AppLogo } from './AppLogo.tsx';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuth();
  const [schoolName, setSchoolName] = useState<string>('Absen Solat');

  const isMasterAdmin = user?.username?.toLowerCase() === 'kamal' || user?.role === 'admin';

  useEffect(() => {
    api.getAppSettings().then((s) => {
      if (s.school_name) setSchoolName(s.school_name);
    }).catch(console.error);
  }, []);

  interface SidebarItem {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    iconSrc?: string;
    badge?: string;
  }

  const navItems: SidebarItem[] = [
    { id: '/dashboard', label: 'Beranda', iconSrc: '/assets/aistudio/house_aef48f8e.svg' },
    { id: '/attendance', label: 'Absensi Solat', iconSrc: '/assets/aistudio/calendar-check_0aad62e4.svg', badge: 'Utama' },
    { id: '/attendance/history', label: 'Riwayat Absensi', icon: History },
    { id: '/reports', label: 'Rekap & Laporan', iconSrc: '/assets/aistudio/chart-no-axes-combined_849e5022.svg' },
    { id: '/students', label: 'Data Siswa', icon: Users },
    { id: '/classes', label: 'Data Kelas', icon: GraduationCap },
    { id: '/prayers', label: 'Jenis Solat', icon: Clock },
    { id: '/academic-years', label: 'Tahun Ajaran', icon: CalendarDays },
    { id: '/settings', label: 'Pengaturan', icon: Settings },
    ...(isMasterAdmin
      ? [{ id: '/admin/feedback', label: 'Evaluasi & Saran', icon: MessageSquareHeart, badge: 'Admin' }]
      : []),
    { id: '/welcome', label: 'Tampilan Awal & Login', icon: Sparkles, badge: 'Mobile' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 min-h-screen">
      {/* Garis Aksen Paling Atas */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-full" />

      {/* Brand Header: Khusus Nama App (Konsisten SIAS) */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <AppLogo className="w-11 h-11 shadow-lg shadow-emerald-950 rounded-2xl ring-2 ring-emerald-500/20 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-xl tracking-wider text-white leading-tight">
            SIAS
          </h1>
          <p className="text-[11px] text-emerald-400 font-medium tracking-tight mt-0.5">
            Sistem Informasi Absensi Solat
          </p>
        </div>
      </div>

      {/* Info Sekolah & Tahun Ajaran Badge */}
      <div className="px-3.5 py-2.5 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5">
        <div className="flex items-center space-x-2 text-xs text-emerald-300 font-bold truncate" title={schoolName}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="truncate">{schoolName || 'Belum Diatur'}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-700/40 pt-1.5">
          <div className="flex items-center space-x-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
            <span>T.A. 2026/2027</span>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Ganjil
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.iconSrc ? (
                  <img
                    src={item.iconSrc}
                    alt={item.label}
                    className="w-4 h-4 object-contain transition-all"
                    style={{
                      filter: isActive
                        ? 'brightness(0) invert(1)'
                        : 'invert(71%) sepia(11%) saturate(478%) hue-rotate(177deg) brightness(88%) contrast(86%)',
                    }}
                  />
                ) : Icon ? (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                ) : null}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div
            onClick={() => onNavigate('/profile')}
            className="flex items-center space-x-2.5 min-w-0 cursor-pointer p-1 -m-1 rounded-lg hover:bg-slate-800/60 transition-colors flex-1 mr-2"
            title="Lihat Profil Saya"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700/80 text-emerald-100 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30 shrink-0">
              {user?.name ? user.name.charAt(0) : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Guru'}</p>
              <p className="text-[11px] text-slate-400 truncate">@{user?.username || 'admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
