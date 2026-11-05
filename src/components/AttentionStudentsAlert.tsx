import React from 'react';
import {
  UserX,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface LowAttendanceStudent {
  id: number;
  name: string;
  class_name: string;
  total_attendance: number;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  uzur: number;
  percentage: number;
}

interface AttentionStudentsAlertProps {
  students: LowAttendanceStudent[];
  schoolName?: string;
  onNavigate?: (path: string, params?: any) => void;
}

export const AttentionStudentsAlert: React.FC<AttentionStudentsAlertProps> = ({
  students = [],
  onNavigate,
}) => {
  // Filter murid dengan kehadiran < 75% atau memiliki catatan alfa
  const targetStudents = students.filter(
    (s) => s.tidak_hadir > 0 || s.percentage < 75
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
      {/* Header Widget */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Murid Memerlukan Perhatian
            </h3>
          </div>
        </div>
      </div>

      {/* Konten Kartu Murid */}
      {targetStudents.length === 0 ? (
        <div className="py-8 px-4 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/60 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-emerald-900">
            Alhamdulillah, Seluruh Murid Istiqomah!
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            Tidak ada murid dengan tingkat kehadiran rendah saat ini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
          {targetStudents.map((student) => (
            <div
              key={student.id}
              className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
            >
              {/* Nama Murid */}
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shrink-0">
                  <UserX className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {student.name}
                </span>
              </div>

              {/* Skor Kehadiran */}
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 block">
                  {student.percentage}%
                </span>
                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                  Skor Kehadiran
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
