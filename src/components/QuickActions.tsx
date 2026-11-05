import React from 'react';
import {
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (path: string, params?: any) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigate,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-800">
          Pintasan Aksi Cepat
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Aksi 1: Mulai Absensi Hari Ini */}
        <button
          type="button"
          onClick={() => onNavigate('/attendance')}
          className="group relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl p-3.5 text-left shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer border border-emerald-600/30 active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block leading-tight text-white group-hover:text-emerald-50">
                Mulai Absensi Hari Ini
              </span>
              <span className="text-[10px] text-emerald-100/90 block truncate mt-0.5">
                Input kehadiran salat kelas
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </button>

        {/* Aksi 2: Cetak Laporan Bulan Ini */}
        <button
          type="button"
          onClick={() => onNavigate('/reports')}
          className="group bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800 rounded-xl p-3.5 text-left border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block leading-tight text-slate-800 group-hover:text-emerald-800">
                Cetak Laporan Bulan Ini
              </span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                Ekspor rekap PDF & Excel
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </button>
      </div>
    </div>
  );
};
