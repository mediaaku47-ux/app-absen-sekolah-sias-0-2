import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  CheckSquare,
  History,
  BarChart3,
  Users,
  GraduationCap,
  Clock,
  CalendarDays,
  Settings,
  ChevronRight,
  User,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Student, ClassItem } from '../types.ts';

interface SearchResultItem {
  id: string;
  category: 'Menu & Fitur' | 'Siswa' | 'Kelas' | 'Jenis Solat';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  action: () => void;
}

interface GlobalSearchProps {
  onNavigate: (path: string, params?: any) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  variant?: 'light' | 'header';
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onNavigate,
  placeholder = 'Cari siswa atau riwayat absensi...',
  className = '',
  inputClassName = '',
  variant = 'light',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy load search index (students & classes) on first focus or input
  const loadSearchData = async () => {
    if (isDataLoaded) return;
    try {
      const [sList, cList] = await Promise.all([
        api.getStudents(),
        api.getClasses(),
      ]);
      setStudents(sList || []);
      setClasses(cList || []);
      setIsDataLoaded(true);
    } catch (e) {
      console.error('Error preloading search index:', e);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System features and navigation catalog
  const systemFeatures = [
    {
      title: 'Dashboard',
      subtitle: 'Ringkasan statistik kehadiran & pantauan hari ini',
      path: '/dashboard',
      keywords: ['dashboard', 'utama', 'beranda', 'home', 'statistik', 'ringkasan', 'grafik'],
      icon: LayoutDashboard,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
    {
      title: 'Absensi Solat Siswa',
      subtitle: 'Input presensi solat berjamaah harian tiap kelas',
      path: '/attendance',
      keywords: ['absen', 'absensi', 'presensi', 'input', 'kehadiran', 'catat', 'solat'],
      icon: CheckSquare,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      badge: 'Utama',
    },
    {
      title: 'Riwayat Absensi',
      subtitle: 'Log catatan presensi lampau, filter & edit catatan',
      path: '/attendance/history',
      keywords: ['riwayat', 'history', 'catatan', 'log', 'kemarin', 'filter'],
      icon: History,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Rekap & Laporan',
      subtitle: 'Analisis persentase kehadiran, cetak & ekspor data',
      path: '/reports',
      keywords: ['rekap', 'laporan', 'report', 'cetak', 'grafik', 'analisis', 'unduh'],
      icon: BarChart3,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-700',
    },
    {
      title: 'Data Siswa',
      subtitle: 'Kelola data siswa, kelas, dan status keaktifan',
      path: '/students',
      keywords: ['murid', 'siswa', 'data murid', 'tambah murid', 'data siswa'],
      icon: Users,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-700',
    },
    {
      title: 'Data Kelas',
      subtitle: 'Daftar kelas rombel',
      path: '/classes',
      keywords: ['kelas', 'rombel', 'tingkat'],
      icon: GraduationCap,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      title: 'Jenis Solat',
      subtitle: 'Konfigurasi waktu solat wajib, dhuha, tarawih',
      path: '/prayers',
      keywords: ['solat', 'sholat', 'subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'dhuha'],
      icon: Clock,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-700',
    },
    {
      title: 'Tahun Ajaran',
      subtitle: 'Atur semester aktif & kalender akademik',
      path: '/academic-years',
      keywords: ['tahun ajaran', 'semester', 'periode', 'akademik', 'ganjil', 'genap'],
      icon: CalendarDays,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
    },
    {
      title: 'Pengaturan Sekolah',
      subtitle: 'Nama madrasah/sekolah, profil, dan konfigurasi sistem',
      path: '/settings',
      keywords: ['pengaturan', 'setting', 'sekolah', 'akun', 'profil', 'password'],
      icon: Settings,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
    },
  ];

  // Static prayer types for quick navigation
  const prayerItems = [
    { name: 'Solat Subuh', desc: 'Presensi waktu Subuh' },
    { name: 'Solat Dzuhur', desc: 'Presensi waktu Dzuhur' },
    { name: 'Solat Ashar', desc: 'Presensi waktu Ashar' },
    { name: 'Solat Maghrib', desc: 'Presensi waktu Maghrib' },
    { name: 'Solat Isya', desc: 'Presensi waktu Isya' },
    { name: 'Solat Dhuha', desc: 'Presensi solat sunnah Dhuha' },
  ];

  // Search filtering logic
  const trimmedQuery = query.trim().toLowerCase();

  const results: SearchResultItem[] = [];

  if (trimmedQuery.length > 0) {
    // 1. Match Navigation / Menus
    systemFeatures.forEach((feat) => {
      const matchTitle = feat.title.toLowerCase().includes(trimmedQuery);
      const matchSubtitle = feat.subtitle.toLowerCase().includes(trimmedQuery);
      const matchKeywords = feat.keywords.some((k) => k.includes(trimmedQuery));

      if (matchTitle || matchSubtitle || matchKeywords) {
        results.push({
          id: `menu-${feat.path}`,
          category: 'Menu & Fitur',
          title: feat.title,
          subtitle: feat.subtitle,
          icon: feat.icon,
          iconBg: feat.iconBg,
          iconColor: feat.iconColor,
          badge: feat.badge || 'Fitur',
          badgeBg: feat.badge ? 'bg-emerald-100' : 'bg-slate-100',
          badgeColor: feat.badge ? 'text-emerald-800' : 'text-slate-600',
          action: () => {
            onNavigate(feat.path);
            setIsOpen(false);
            setQuery('');
          },
        });
      }
    });

    // 2. Match Classes
    classes.forEach((c) => {
      const cName = c.name.toLowerCase();
      if (cName.includes(trimmedQuery) || `kelas ${cName}`.includes(trimmedQuery)) {
        results.push({
          id: `class-${c.id}`,
          category: 'Kelas',
          title: `Kelas ${c.name}`,
          subtitle: `${c.student_count ?? 0} Siswa terdaftar`,
          icon: GraduationCap,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-700',
          badge: 'Kelas',
          badgeBg: 'bg-amber-100',
          badgeColor: 'text-amber-800',
          action: () => {
            // Direct to attendance page with this class selected
            onNavigate('/attendance', { class_id: c.id });
            setIsOpen(false);
            setQuery('');
          },
        });
      }
    });

    // 3. Match Prayer Types
    prayerItems.forEach((p, idx) => {
      if (p.name.toLowerCase().includes(trimmedQuery)) {
        results.push({
          id: `prayer-${idx}`,
          category: 'Jenis Solat',
          title: p.name,
          subtitle: p.desc,
          icon: Clock,
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-700',
          badge: 'Solat',
          badgeBg: 'bg-purple-100',
          badgeColor: 'text-purple-800',
          action: () => {
            onNavigate('/attendance');
            setIsOpen(false);
            setQuery('');
          },
        });
      }
    });

    // 4. Match Students (max 6 matches to keep dropdown neat and responsive)
    let studentMatches = 0;
    for (const s of students) {
      if (studentMatches >= 6) break;
      const sName = s.name.toLowerCase();
      const sClass = (s.class_name || '').toLowerCase();

      if (sName.includes(trimmedQuery) || sClass.includes(trimmedQuery)) {
        studentMatches++;
        // Navigasi ke Data Siswa
        results.push({
          id: `student-${s.id}`,
          category: 'Siswa',
          title: s.name,
          subtitle: `Kelas ${s.class_name || '-'}`,
          icon: User,
          iconBg: 'bg-teal-50',
          iconColor: 'text-teal-700',
          badge: s.gender === 'L' ? 'Ikhwan' : 'Akhwat',
          badgeBg: s.gender === 'L' ? 'bg-blue-100' : 'bg-pink-100',
          badgeColor: s.gender === 'L' ? 'text-blue-800' : 'text-pink-800',
          action: () => {
            onNavigate('/students', { search: s.name });
            setIsOpen(false);
            setQuery('');
          },
        });

        // Quick shortcut: Riwayat Absensi Siswa ini
        results.push({
          id: `student-history-${s.id}`,
          category: 'Siswa',
          title: `Riwayat Absen: ${s.name}`,
          subtitle: `Lihat log presensi Kelas ${s.class_name || '-'}`,
          icon: History,
          iconBg: 'bg-sky-50',
          iconColor: 'text-sky-700',
          badge: 'Riwayat',
          badgeBg: 'bg-sky-100',
          badgeColor: 'text-sky-800',
          action: () => {
            onNavigate('/attendance/history', { search: s.name });
            setIsOpen(false);
            setQuery('');
          },
        });
      }
    }
  }

  // Group results by category for clean presentation
  const groupedResults = results.reduce<Record<string, SearchResultItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    loadSearchData();
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    loadSearchData();
  };

  const isDarkVariant = variant === 'header';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        {/* Ikon Kaca Pembesar di Sisi Kiri Input */}
        <div className="absolute left-3.5 sm:left-4 text-emerald-300 pointer-events-none flex items-center justify-center">
          <Search
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isDarkVariant ? 'text-emerald-300' : 'text-slate-400'}`}
          />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={handleFocus}
          onChange={handleChange}
          placeholder={placeholder}
          className={
            inputClassName ||
            (isDarkVariant
              ? 'w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-emerald-200/70 focus:placeholder:text-slate-400 border border-emerald-400/40 focus:border-emerald-400 rounded-xl pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all shadow-inner focus:shadow-md focus:outline-none backdrop-blur-md min-h-[44px]'
              : 'w-full bg-white hover:bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200/90 hover:border-emerald-500/50 focus:border-emerald-500 rounded-xl pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all shadow-sm focus:shadow-md focus:outline-none min-h-[44px]')
          }
        />
        {/* Tombol Hapus (Clear) di Sebelah Kanan jika ada teks */}
        {query && (
          <div className="absolute right-2.5 sm:right-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkVariant
                  ? 'text-emerald-300 hover:text-white hover:bg-white/20'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Hapus pencarian"
              aria-label="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[420px] sm:max-h-[480px] flex flex-col">
          {/* Dropdown Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Hasil pencarian: <span className="text-emerald-700 font-extrabold">"{query}"</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {results.length} ditemukan
            </span>
          </div>

          {/* Result Content */}
          <div className="overflow-y-auto divide-y divide-slate-100 p-1.5">
            {results.length > 0 ? (
              Object.entries(groupedResults).map(([catName, items]) => (
                <div key={catName} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {catName}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.action}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50/70 focus:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 border border-slate-200/50 group-hover:scale-105 transition-transform`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 group-hover:text-slate-600 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  item.badgeBg || 'bg-slate-100'
                                } ${item.badgeColor || 'text-slate-600'} hidden xs:inline-block`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-700">Tidak ditemukan</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tidak ada menu, fitur, siswa, atau kelas yang cocok dengan kata kunci "{query}"
                </p>
              </div>
            )}
          </div>

          {/* Dropdown Footer Hint */}
          <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Klik item untuk langsung menuju halaman atau data</span>
            <span className="hidden sm:inline">ESC untuk menutup</span>
          </div>
        </div>
      )}
    </div>
  );
};
