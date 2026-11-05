import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  X,
  TrendingUp,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AttendancePeriodStat } from '../types.ts';

interface DayRecord {
  attendance_date: string;
  total: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
}

interface AttendanceStatsDonutProps {
  daily?: AttendancePeriodStat;
  weekly?: AttendancePeriodStat;
  monthly?: AttendancePeriodStat;
  last7Days?: DayRecord[];
  onNavigate?: (path: string, params?: any) => void;
}

export const AttendanceStatsDonut: React.FC<AttendanceStatsDonutProps> = ({
  daily,
  weekly,
  monthly,
  last7Days = [],
  onNavigate,
}) => {
  // Mode periode aktif: 'weekly' (Pekan), 'daily' (Hari), 'monthly' (Bulan)
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  const [isAnimated, setIsAnimated] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AttendancePeriodStat | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    label: string;
    subLabel: string;
    value: number;
    cumulative: number;
    total: number;
    hadir: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Ambil data periode aktif
  const currentStat: AttendancePeriodStat =
    selectedPeriod === 'daily'
      ? daily || {
          periodType: 'daily',
          title: 'Harian',
          subtitle: 'Hari Ini',
          dateRangeText: 'Hari Ini',
          startDate: '',
          endDate: '',
          total: 0,
          hadir: 0,
          tidakHadir: 0,
          izin: 0,
          sakit: 0,
          uzur: 0,
          percentage: 0,
          hasData: false,
        }
      : selectedPeriod === 'monthly'
      ? monthly || {
          periodType: 'monthly',
          title: 'Bulanan',
          subtitle: 'Bulan Berjalan',
          dateRangeText: 'Bulan Berjalan',
          startDate: '',
          endDate: '',
          total: 0,
          hadir: 0,
          tidakHadir: 0,
          izin: 0,
          sakit: 0,
          uzur: 0,
          percentage: 0,
          hasData: false,
        }
      : weekly || {
          periodType: 'weekly',
          title: 'Mingguan',
          subtitle: 'Minggu Berjalan',
          dateRangeText: 'Minggu Berjalan',
          startDate: '',
          endDate: '',
          total: 0,
          hadir: 0,
          tidakHadir: 0,
          izin: 0,
          sakit: 0,
          uzur: 0,
          percentage: 0,
          hasData: false,
        };

  // Ukuran geometri diagram Donut
  const radius = 33;
  const strokeWidth = 6.5;
  const circumference = 2 * Math.PI * radius; // ~207.34
  const progressOffset = isAnimated && currentStat.hasData
    ? circumference - (currentStat.percentage / 100) * circumference
    : circumference;

  // Persiapan data titik grafik garis sesuai pilihan periode
  let chartPoints: Array<{
    label: string;
    subLabel: string;
    value: number;
    cumulative: number;
    total: number;
    hadir: number;
  }> = [];

  if (selectedPeriod === 'weekly') {
    // Mode Pekan / 7 Hari (Sen, Sel, Rab, Kam, Jum, Sab, Min)
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    let runningHadir = 0;
    let runningTotal = 0;

    // Jika last7Days ada data
    if (last7Days.length > 0) {
      chartPoints = last7Days.map((item, idx) => {
        const total = item.total || 0;
        const hadir = item.hadir || 0;
        const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
        
        runningHadir += hadir;
        runningTotal += total;
        const cumulativeRate = runningTotal > 0 ? Math.round((runningHadir / runningTotal) * 100) : rate;

        const dateObj = new Date(item.attendance_date + 'T12:00:00');
        const shortDay = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('id-ID', { weekday: 'short' })
          : dayNames[idx % 7];

        const formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : '';

        return {
          label: shortDay,
          subLabel: formattedDate,
          value: rate,
          cumulative: cumulativeRate,
          total,
          hadir,
        };
      });
    }

    // Pastikan minimal ada 7 titik berurutan jika data belum lengkap
    if (chartPoints.length < 7) {
      const existingCount = chartPoints.length;
      for (let i = existingCount; i < 7; i++) {
        chartPoints.push({
          label: dayNames[i],
          subLabel: '',
          value: 0,
          cumulative: 0,
          total: 0,
          hadir: 0,
        });
      }
    }
  } else if (selectedPeriod === 'daily') {
    // Mode Harian (Jadwal Salat: Subuh, Duha, Zuhur, Asar, Magrib, Isya)
    const prayers = daily?.prayerBreakdown && daily.prayerBreakdown.length > 0
      ? daily.prayerBreakdown
      : [
          { id: 1, name: 'Subuh', percentage: 0, total: 0, hadir: 0 },
          { id: 2, name: 'Duha', percentage: 0, total: 0, hadir: 0 },
          { id: 3, name: 'Zuhur', percentage: 0, total: 0, hadir: 0 },
          { id: 4, name: 'Asar', percentage: 0, total: 0, hadir: 0 },
          { id: 5, name: 'Magrib', percentage: 0, total: 0, hadir: 0 },
          { id: 6, name: 'Isya', percentage: 0, total: 0, hadir: 0 },
        ];

    let runningHadir = 0;
    let runningTotal = 0;

    chartPoints = prayers.map((p) => {
      runningHadir += p.hadir;
      runningTotal += p.total;
      const cumulativeRate = runningTotal > 0 ? Math.round((runningHadir / runningTotal) * 100) : p.percentage;

      return {
        label: p.name,
        subLabel: 'Salat',
        value: p.percentage,
        cumulative: cumulativeRate,
        total: p.total,
        hadir: p.hadir,
      };
    });
  } else {
    // Mode Bulanan (Pekan 1, Pekan 2, Pekan 3, Pekan 4)
    const monthWeeks = [
      { label: 'Pkn 1', subLabel: 'Tgl 1-7' },
      { label: 'Pkn 2', subLabel: 'Tgl 8-14' },
      { label: 'Pkn 3', subLabel: 'Tgl 15-21' },
      { label: 'Pkn 4', subLabel: 'Tgl 22-31' },
    ];

    const monthlyPct = monthly?.percentage || 0;
    const monthlyTotal = monthly?.total || 0;
    const monthlyHadir = monthly?.hadir || 0;

    // Estimasi tren pekan bulanan
    chartPoints = monthWeeks.map((w, idx) => {
      const factor = idx === 0 ? 0.92 : idx === 1 ? 0.98 : idx === 2 ? 1.02 : 1.0;
      const val = monthlyTotal > 0 ? Math.min(100, Math.round(monthlyPct * factor)) : 0;
      return {
        label: w.label,
        subLabel: w.subLabel,
        value: val,
        cumulative: monthlyPct,
        total: Math.round(monthlyTotal / 4),
        hadir: Math.round(monthlyHadir / 4),
      };
    });
  }

  // Koordinat SVG Grafik Garis
  const svgWidth = 520;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getCoordinates = (points: typeof chartPoints) => {
    if (points.length === 0) return [];
    return points.map((p, idx) => {
      const x = paddingLeft + (idx / Math.max(points.length - 1, 1)) * chartWidth;
      // Y: 0% di bawah, 100% di atas
      const clampedVal = Math.max(0, Math.min(100, p.value));
      const y = paddingTop + (1 - clampedVal / 100) * chartHeight;

      // Cumulative Y
      const clampedCum = Math.max(0, Math.min(100, p.cumulative));
      const yCum = paddingTop + (1 - clampedCum / 100) * chartHeight;

      return { x, y, yCum, point: p, index: idx };
    });
  };

  const coords = getCoordinates(chartPoints);

  // Buat path SVG untuk garis Harian/Periode
  const linePath = coords.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, '');

  // Buat path SVG untuk area gradien di bawah garis
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`
    : '';

  // Buat path SVG untuk garis Kumulatif
  const cumLinePath = coords.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.yCum.toFixed(1)}`;
  }, '');

  // Grid baris persentase Y
  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Container Utama: 2 Kolom Seimbang (Donut Tinjauan Cepat di Kiri, Grafik Garis di Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* ================= KOLOM KIRI (TINJAUAN CEPAT & PEMILIH PERIODE) ================= */}
        <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-50/40">
          
          {/* Header & Tab Pemilih Periode (Hari, Pekan, Bulan) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">
                Pilih Periode:
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {currentStat.title}
              </span>
            </div>

            {/* Tombol Tab Kategori Periode */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedPeriod('daily')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPeriod === 'daily'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPeriod('weekly')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPeriod === 'weekly'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Pekan</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPeriod('monthly')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPeriod === 'monthly'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Bulan</span>
              </button>
            </div>
          </div>

          {/* Bagian Donut Chart Tinjauan Cepat */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">
                Tinjauan Cepat
              </span>
              <button
                type="button"
                onClick={() => setSelectedDetail(currentStat)}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>Rincian</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Donut Circle */}
            <div className="relative flex items-center justify-center py-1">
              <svg
                className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90 select-none"
                viewBox="0 0 86 86"
              >
                {/* Background Ring */}
                <circle
                  cx="43"
                  cy="43"
                  r={radius}
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                />

                {/* Progress Ring */}
                {currentStat.hasData ? (
                  <circle
                    cx="43"
                    cy="43"
                    r={radius}
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                ) : (
                  <circle
                    cx="43"
                    cy="43"
                    r={radius}
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                    strokeDasharray="3 3"
                  />
                )}
              </svg>

              {/* Teks di tengah Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                {currentStat.hasData ? (
                  <>
                    <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {currentStat.percentage}%
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mt-0.5">
                      Kehadiran
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-bold text-slate-400 leading-none">
                      -
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Belum Ada Data
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Total Siswa / Presensi */}
            <div className="text-center pt-1 border-t border-slate-100">
              {currentStat.hasData ? (
                <p className="text-[11px] font-semibold text-slate-600">
                  <span className="font-extrabold text-emerald-700">
                    {currentStat.hadir}
                  </span>{' '}
                  dari{' '}
                  <span className="font-extrabold text-slate-800">
                    {currentStat.total}
                  </span>{' '}
                  jadwal tercatat
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Belum ada presensi pada periode ini
                </p>
              )}
            </div>
          </div>

          {/* Subtext info tanggal */}
          <div className="text-center text-[10px] text-slate-400 truncate">
            {currentStat.dateRangeText}
          </div>
        </div>

        {/* ================= KOLOM KANAN (GRAFIK GARIS TREN KEHADIRAN) ================= */}
        <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-3">
          
          {/* Header Grafik & Legenda */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>Grafik Garis Tren Kehadiran</span>
                <span className="text-xs text-slate-400 font-semibold">
                  • {selectedPeriod === 'weekly' ? 'Mingguan' : selectedPeriod === 'daily' ? 'Harian' : 'Bulanan'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Garis naik saat tingkat kehadiran meningkat, turun saat menurun
              </p>
            </div>

            {/* Legenda: Harian vs Kumulatif */}
            <div className="flex items-center space-x-3 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span className="font-bold text-slate-700 text-[11px]">
                  {selectedPeriod === 'daily' ? 'Per Salat' : 'Harian'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-800 inline-block shadow-xs" />
                <span className="font-bold text-slate-700 text-[11px]">
                  Kumulatif
                </span>
              </div>
            </div>
          </div>

          {/* Area SVG Grafik Garis Interaktif */}
          <div className="relative w-full overflow-hidden select-none">
            <svg
              className="w-full h-44 sm:h-52 overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradien lembut di bawah kurva hijau emerald */}
                <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Garis-garis Grid Horizontal & Label Y-Axis */}
              {yTicks.map((tick) => {
                const y = paddingTop + (1 - tick / 100) * chartHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray={tick === 0 ? 'none' : '3 3'}
                      strokeWidth={tick === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-slate-400 font-mono text-[9px] sm:text-[10px] font-semibold"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Area gradien hijau di bawah garis */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#emeraldAreaGradient)"
                  className="transition-all duration-700"
                />
              )}

              {/* Garis 2: Garis Kumulatif (Teal Tua) */}
              {cumLinePath && (
                <path
                  d={cumLinePath}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700"
                />
              )}

              {/* Garis 1: Garis Utama Harian (Emerald) */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700"
                />
              )}

              {/* Titik-titik Garis Kumulatif */}
              {coords.map((c) => (
                <circle
                  key={`cum-${c.index}`}
                  cx={c.x}
                  cy={c.yCum}
                  r="3.5"
                  fill="#0F766E"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-500"
                />
              ))}

              {/* Titik-titik Garis Utama Harian & Target Interaksi */}
              {coords.map((c) => {
                const isHovered = hoveredPoint?.index === c.index;
                return (
                  <g key={`point-${c.index}`}>
                    {/* Circle marker */}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isHovered ? '6' : '4.5'}
                      fill="#10B981"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? '2.5' : '2'}
                      className="transition-all duration-200 cursor-pointer"
                    />

                    {/* Area sentuh kursor tak terlihat yang lebih besar */}
                    <rect
                      x={c.x - 18}
                      y={paddingTop}
                      width="36"
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ ...c.point, index: c.index })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Label Sumbu X di Bawah Titik */}
                    <text
                      x={c.x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${
                        isHovered ? 'fill-emerald-700 font-black' : 'fill-slate-600'
                      }`}
                    >
                      {c.point.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Mengambang saat Titik Disorot */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 z-20 bg-slate-900/95 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <p className="font-extrabold text-emerald-300">
                  {hoveredPoint.label} {hoveredPoint.subLabel && `(${hoveredPoint.subLabel})`}
                </p>
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Kehadiran: <strong className="text-white">{hoveredPoint.value}%</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Kumulatif: <strong className="text-white">{hoveredPoint.cumulative}%</strong></span>
                  </span>
                </div>
                {hoveredPoint.total > 0 && (
                  <p className="text-[10px] text-slate-400">
                    {hoveredPoint.hadir} hadir dari {hoveredPoint.total} jadwal
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Indikator Ringkas di Bawah Grafik */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Statistik adaptif per {selectedPeriod === 'weekly' ? 'Pekan' : selectedPeriod === 'daily' ? 'Hari' : 'Bulan'}</span>
            </span>

            <span className="text-[10px] text-slate-400">
              Arahkan kursor ke titik grafik untuk melihat rincian persentase
            </span>
          </div>
        </div>

      </div>

      {/* Modal / Dialog Rincian Absensi Saat Pengguna Menekan Rincian */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Rincian Absensi {selectedDetail.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {selectedDetail.dateRangeText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup rincian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Rincian */}
            {selectedDetail.hasData ? (
              <div className="space-y-4">
                {/* Ringkasan Utama Persentase */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Persentase Kehadiran
                    </span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-3xl font-black text-emerald-950">
                        {selectedDetail.percentage}%
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold">
                        ({selectedDetail.hadir} dari {selectedDetail.total} jadwal)
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-emerald-200 flex items-center justify-center text-emerald-600 font-extrabold text-xs">
                    {selectedDetail.percentage}%
                  </div>
                </div>

                {/* Grid Rincian Status */}
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Distribusi Status Presensi
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        Hadir
                      </span>
                      <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                        {selectedDetail.hadir}
                      </p>
                    </div>

                    <div className="bg-sky-50/70 border border-sky-200 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-sky-700 uppercase">
                        Izin & Sakit
                      </span>
                      <p className="text-xl font-extrabold text-sky-900 mt-0.5">
                        {selectedDetail.izin + selectedDetail.sakit}
                      </p>
                      <span className="text-[9px] text-sky-600 block">
                        {selectedDetail.izin} izin • {selectedDetail.sakit} sakit
                      </span>
                    </div>

                    <div className="bg-purple-50/70 border border-purple-200 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-purple-700 uppercase">
                        Uzur
                      </span>
                      <p className="text-xl font-extrabold text-purple-900 mt-0.5">
                        {selectedDetail.uzur}
                      </p>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">
                        Alfa
                      </span>
                      <p className="text-xl font-extrabold text-rose-900 mt-0.5">
                        {selectedDetail.tidakHadir}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rincian per Salat jika tersedia */}
                {selectedDetail.prayerBreakdown && selectedDetail.prayerBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Rincian per Jadwal Salat
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedDetail.prayerBreakdown.map((prayer) => (
                        <div
                          key={prayer.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-slate-800">
                              Salat {prayer.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-medium">
                              {prayer.hadir} / {prayer.total}
                            </span>
                            <span
                              className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                prayer.percentage >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : prayer.percentage >= 60
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {prayer.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-sm">Belum ada data presensi untuk periode ini.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
