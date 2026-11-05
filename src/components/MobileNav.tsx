import React from 'react';
import {
  Users,
  Settings,
} from 'lucide-react';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconSrc?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate }) => {
  const mainTabs: NavTab[] = [
    { id: '/dashboard', label: 'Beranda', iconSrc: '/assets/aistudio/house_aef48f8e.svg' },
    { id: '/attendance', label: 'Absensi', iconSrc: '/assets/aistudio/calendar-check_0aad62e4.svg' },
    { id: '/students', label: 'Siswa', icon: Users },
    { id: '/reports', label: 'Laporan', iconSrc: '/assets/aistudio/chart-no-axes-combined_849e5022.svg' },
    { id: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 py-1.5 px-1.5 grid grid-cols-5 items-center shadow-lg">
      {mainTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPath === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`group w-full flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[11px] transition-colors cursor-pointer text-center select-none ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className="w-5 h-5 mb-1 flex items-center justify-center shrink-0">
              {tab.iconSrc ? (
                <img
                  src={tab.iconSrc}
                  alt={tab.label}
                  className="w-5 h-5 object-contain transition-all"
                  style={{
                    filter: isActive
                      ? 'invert(72%) sepia(51%) saturate(544%) hue-rotate(114deg) brightness(96%) contrast(89%)'
                      : 'invert(71%) sepia(11%) saturate(478%) hue-rotate(177deg) brightness(88%) contrast(86%)',
                  }}
                />
              ) : Icon ? (
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              ) : null}
            </div>
            <span className="w-full truncate text-center tracking-tight leading-none block">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
