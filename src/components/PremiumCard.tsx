import React from 'react';
import { Sparkles, ArrowUpRight, TrendingUp, ChevronRight } from 'lucide-react';

interface PremiumCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  statValue?: string;
  statLabel?: string;
  trend?: string;
  onAction?: () => void;
  className?: string;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  title = 'Ringkasan Kehadiran',
  subtitle = 'Statistik kehadiran solat pekan ini',
  badge = 'Update Real-time',
  statValue = '98.5%',
  statLabel = 'Tingkat Kehadiran Murid',
  trend = '+4.2% dari pekan lalu',
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        group relative isolate overflow-hidden
        rounded-2xl sm:rounded-3xl bg-white
        /* Border tipis presisi dengan inset highlight */
        border border-slate-200/90
        /* Bayangan bertingkat (multi-layered elevation shadow) */
        shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_12px_24px_-4px_rgba(15,23,42,0.07),0_24px_48px_-8px_rgba(15,23,42,0.04)]
        /* Ring border halus untuk batas visual tegas */
        ring-1 ring-slate-900/5
        /* Efek hover elevasi halus */
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-[0_8px_12px_-2px_rgba(15,23,42,0.06),0_20px_35px_-4px_rgba(15,23,42,0.09),0_30px_60px_-12px_rgba(16,185,129,0.12)]
        hover:border-emerald-200/90 hover:ring-emerald-500/10
        ${className}
      `}
    >
      {/* Aksen ambient glow di sudut atas kartu (subtle luxury lighting) */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-emerald-500/15"
        aria-hidden="true"
      />

      <div className="relative p-5 sm:p-6 flex flex-col justify-between h-full space-y-5">
        {/* Header Kartu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Ikon Wadah dengan Gradasi Lembut & Border Inset */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/60 shadow-xs text-emerald-800 transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-poppins text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Lencana (Badge) Status Ringkas */}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {badge}
          </span>
        </div>

        {/* Nilai Statistik Utama & Indikator Tren */}
        <div className="rounded-xl sm:rounded-2xl bg-slate-50/80 p-4 border border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {statLabel}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {statValue}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100/60 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
            <span>{trend}</span>
          </div>
        </div>

        {/* Tombol Aksi di Bagian Bawah */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAction}
            className="
              w-full py-2.5 px-4 rounded-xl
              bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900
              text-white text-xs sm:text-sm font-bold
              shadow-md shadow-emerald-950/20
              transition-all duration-200 ease-out
              flex items-center justify-center gap-2
              cursor-pointer active:scale-[0.99]
            "
          >
            <span>Lihat Laporan Lengkap</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onAction}
            title="Buka detail"
            className="
              h-10 w-10 shrink-0 rounded-xl
              bg-slate-100 hover:bg-slate-200/80 text-slate-700
              border border-slate-200/60
              transition-all duration-200
              flex items-center justify-center
              cursor-pointer
            "
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
