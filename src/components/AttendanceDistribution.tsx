import React from 'react';
import {
  CheckCircle2,
  Clock,
  HeartPulse,
  XCircle,
  PieChart,
} from 'lucide-react';

interface AttendanceDistributionProps {
  today: {
    total: number;
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  };
}

export const AttendanceDistribution: React.FC<AttendanceDistributionProps> = ({
  today,
}) => {
  const total = today.total || 0;
  const hadir = today.hadir || 0;
  const izin = today.izin || 0;
  const sakit = today.sakit || 0;
  const tidakHadir = today.tidakHadir || 0;

  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const hadirPct = getPercent(hadir);
  const izinPct = getPercent(izin);
  const sakitPct = getPercent(sakit);
  const alfaPct = getPercent(tidakHadir);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-800">
          Ringkasan Status Absensi (Distribusi Keterangan)
        </h3>
      </div>

      {/* 4 Cards Breakdown: Hadir, Izin, Sakit, Alfa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Hadir */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold">Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-900">
              {hadir}
            </span>
            <span className="text-xs font-bold text-emerald-700">
              {hadirPct}%
            </span>
          </div>
        </div>

        {/* Izin */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-800 mb-1">
            <span className="text-xs font-bold">Izin</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-sky-900">
              {izin}
            </span>
            <span className="text-xs font-bold text-sky-700">
              {izinPct}%
            </span>
          </div>
        </div>

        {/* Sakit */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold">Sakit</span>
            <HeartPulse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-900">
              {sakit}
            </span>
            <span className="text-xs font-bold text-amber-700">
              {sakitPct}%
            </span>
          </div>
        </div>

        {/* Alfa / Tidak Hadir */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-bold">Alfa / Absen</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-rose-900">
              {tidakHadir}
            </span>
            <span className="text-xs font-bold text-rose-700">
              {alfaPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
