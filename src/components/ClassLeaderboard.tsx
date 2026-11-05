import React, { useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
} from 'lucide-react';

export interface ClassStatItem {
  id: number;
  class_name: string;
  grade?: string;
  total: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
}

interface ClassLeaderboardProps {
  classStats: ClassStatItem[];
  schoolName?: string;
  onSelectClass?: (classId: string) => void;
  onNavigate?: (path: string, params?: any) => void;
}

export const ClassLeaderboard: React.FC<ClassLeaderboardProps> = ({
  classStats = [],
  onSelectClass,
  onNavigate,
}) => {
  // Urutkan langsung seluruh kelas berdasarkan persentase kehadiran tertinggi
  const sortedClasses = useMemo(() => {
    return classStats
      .filter((item) => item.total > 0)
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return b.hadir - a.hadir;
      });
  }, [classStats]);

  const topClasses = sortedClasses.slice(0, 5);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shadow-xs border border-amber-300 ring-2 ring-amber-200 shrink-0">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-xs border border-slate-300 shrink-0">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-600/30 text-amber-900 font-black flex items-center justify-center text-xs shadow-xs border border-amber-600/40 shrink-0">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
      {/* Header Widget */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              {topClasses.length <= 3 ? 'Peringkat Kelas Terdisiplin' : 'Top 5 Kelas Terdisiplin'}
            </h3>
          </div>
        </div>
      </div>

      {/* Daftar Peringkat Kelas (Langsung Seluruh Kelas) */}
      {topClasses.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Award className="w-6 h-6 mx-auto mb-1 text-slate-300" />
          Belum ada akumulasi data presensi kelas tercatat bulan ini
        </div>
      ) : (
        <div className="space-y-2.5">
          {topClasses.map((item, idx) => {
            const rank = idx + 1;
            const isFirst = rank === 1;

            return (
              <div
                key={item.id}
                onClick={() => onSelectClass && onSelectClass(String(item.id))}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border-amber-200/90 hover:border-amber-400 hover:shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
                }`}
                title="Klik untuk memfilter dashboard ke kelas ini"
              >
                {/* Ranking & Info Kelas */}
                <div className="flex items-center space-x-3 min-w-0">
                  {getRankBadge(rank)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-emerald-800 truncate">
                        {item.class_name.toLowerCase().startsWith('kelas')
                          ? item.class_name
                          : `Kelas ${item.class_name}`}
                      </span>

                      {isFirst && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-300">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Paling Rajin</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {item.hadir} hadir dari {item.total} jadwal presensi
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Persentase */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="hidden sm:block w-24">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 90
                            ? 'bg-emerald-500'
                            : item.percentage >= 75
                            ? 'bg-teal-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-black block ${
                        isFirst
                          ? 'text-amber-700'
                          : item.percentage >= 85
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
