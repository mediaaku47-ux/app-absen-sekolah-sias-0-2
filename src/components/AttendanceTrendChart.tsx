import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

interface DayStat {
  attendance_date: string;
  total: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
}

interface AttendanceTrendChartProps {
  last7Days: DayStat[];
  onNavigate?: (path: string, params?: any) => void;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  last7Days = [],
  onNavigate,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Format array to ensure accurate representation
  const data = (last7Days || []).map((day) => {
    const total = day.total || 0;
    const hadir = day.hadir || 0;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const dateObj = new Date(day.attendance_date + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

    return {
      ...day,
      percentage,
      dayName,
      formattedDate,
    };
  });

  // Calculate statistics summary
  const totalDays = data.length;
  const daysWithData = data.filter((d) => d.total > 0);
  const avgPercentage =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((acc, curr) => acc + curr.percentage, 0) /
            daysWithData.length
        )
      : 0;

  // Find lowest and highest days
  const sortedDays = [...daysWithData].sort(
    (a, b) => b.percentage - a.percentage
  );
  const bestDay = sortedDays[0];
  const lowestDay = sortedDays[sortedDays.length - 1];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header Widget */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Grafik Tren Kehadiran (7 Hari Terakhir)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Fluktuasi tingkat kedisiplinan salat harian sekolah
            </p>
          </div>
        </div>

        {/* Badge Rata-rata 7 Hari */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] text-slate-500 font-bold">Rata-rata:</span>
          <span
            className={`text-xs font-black ${
              avgPercentage >= 80
                ? 'text-emerald-700'
                : avgPercentage >= 65
                ? 'text-teal-700'
                : 'text-amber-700'
            }`}
          >
            {avgPercentage}%
          </span>
        </div>
      </div>

      {/* Insight Highlight Card */}
      {daysWithData.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {bestDay && (
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Kehadiran Tertinggi:</span>
              </span>
              <span className="font-bold text-emerald-800">
                {bestDay.dayName}, {bestDay.formattedDate} ({bestDay.percentage}%)
              </span>
            </div>
          )}
          {lowestDay && lowestDay.percentage < 85 && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-amber-900 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Perlu Perhatian:</span>
              </span>
              <span className="font-bold text-amber-800">
                {lowestDay.dayName}, {lowestDay.formattedDate} ({lowestDay.percentage}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bar Chart Area */}
      {data.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
          <Calendar className="w-6 h-6 mb-1 text-slate-300" />
          <span>Belum ada rekaman riwayat presensi 7 hari terakhir</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Chart Container */}
          <div className="h-48 pt-6 pb-2 px-2 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-200">
            {data.map((day, idx) => {
              const isHovered = hoveredIndex === idx;
              const hasRecorded = day.total > 0;
              const barHeightPct = hasRecorded ? Math.max(day.percentage, 8) : 4;

              // Color determination
              let barColorClass = 'bg-slate-200';
              if (hasRecorded) {
                if (day.percentage >= 85) {
                  barColorClass = 'bg-gradient-to-t from-emerald-600 to-emerald-500';
                } else if (day.percentage >= 70) {
                  barColorClass = 'bg-gradient-to-t from-teal-600 to-teal-500';
                } else {
                  barColorClass = 'bg-gradient-to-t from-amber-600 to-amber-500';
                }
              }

              return (
                <div
                  key={day.attendance_date}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95 duration-150">
                      <p className="font-bold text-emerald-300">
                        {day.dayName}, {day.formattedDate}
                      </p>
                      {hasRecorded ? (
                        <p className="text-slate-200 font-medium mt-0.5">
                          {day.hadir} dari {day.total} siswa ({day.percentage}%)
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">Tidak ada presensi</p>
                      )}
                    </div>
                  )}

                  {/* Percentage Label on Top of Bar */}
                  <span
                    className={`text-[10px] font-black mb-1.5 transition-colors ${
                      hasRecorded
                        ? isHovered
                          ? 'text-emerald-700 scale-110'
                          : 'text-slate-600'
                        : 'text-slate-300'
                    }`}
                  >
                    {hasRecorded ? `${day.percentage}%` : '-'}
                  </span>

                  {/* The Bar */}
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${barColorClass} ${
                        isHovered ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                      }`}
                    />
                  </div>

                  {/* Date labels below bar */}
                  <div className="mt-2 text-center select-none">
                    <span className="block text-[11px] font-bold text-slate-700">
                      {day.dayName}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-medium">
                      {day.formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend and Note */}
          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-500">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Tinggi (≥85%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                <span>Sedang (70-84%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Perlu Evaluasi (&lt;70%)</span>
              </span>
            </div>

            {totalDays < 7 && (
              <span className="text-[10px] text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Info className="w-3 h-3 text-amber-600" />
                <span>Data baru terkumpul {totalDays} hari</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
