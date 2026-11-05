import React, { useState, useEffect } from 'react';
import { Edit2, Users, Loader2 } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { api } from '../services/api.ts';
import { Student } from '../types.ts';

interface StudentDetailData {
  student: Student & { academic_year_name?: string };
  summary: {
    total: number;
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    percentage: number;
  };
  history: Array<{
    id: number;
    attendance_date: string;
    prayer_name: string;
    status: string;
    notes?: string | null;
  }>;
}

interface StudentDetailModalProps {
  studentId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      setIsLoading(true);
      setError(null);
      api
        .getStudentDetail(studentId)
        .then((res: any) => {
          setData(res);
        })
        .catch((err: any) => {
          console.error(err);
          setError(err.message || 'Gagal memuat rincian siswa');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, studentId]);

  return (
    <Modal
      isOpen={isOpen && !!studentId}
      onClose={onClose}
      title="Detail Siswa & Statistik Kehadiran"
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memuat data rincian murid...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-3">
          <p className="text-sm text-rose-600 font-semibold">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Header Profil Singkat Murid */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-poppins font-black text-base sm:text-lg text-slate-800">
                  {data.student.name}
                </h4>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    data.student.gender === 'L'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-pink-50 text-pink-800 border border-pink-200'
                  }`}
                >
                  {data.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelas: <strong className="text-slate-700">{data.student.class_name || '-'}</strong>
                {data.student.academic_year_name && (
                  <span> • TA: {data.student.academic_year_name}</span>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  data.summary.percentage >= 85
                    ? 'text-emerald-700'
                    : data.summary.percentage >= 70
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {data.summary.percentage}%
              </span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Kehadiran
              </span>
            </div>
          </div>

          {/* Kotak Rekapitulasi Status */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 bg-gradient-to-b from-emerald-50 to-emerald-100/70 border border-emerald-300 border-b-2 border-b-emerald-500 rounded-xl shadow-2xs">
              <span className="font-extrabold text-[10px] sm:text-xs text-emerald-800 uppercase tracking-wide">
                Hadir
              </span>
              <p className="font-black text-emerald-950 text-sm sm:text-base mt-0.5">
                {data.summary.hadir}
              </p>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-rose-50 to-rose-100/70 border border-rose-300 border-b-2 border-b-rose-500 rounded-xl shadow-2xs">
              <span className="font-extrabold text-[10px] sm:text-xs text-rose-800 uppercase tracking-wide">
                Alfa
              </span>
              <p className="font-black text-rose-950 text-sm sm:text-base mt-0.5">
                {data.summary.tidakHadir}
              </p>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-sky-50 to-sky-100/70 border border-sky-300 border-b-2 border-b-sky-500 rounded-xl shadow-2xs">
              <span className="font-extrabold text-[10px] sm:text-xs text-sky-800 uppercase tracking-wide">
                Izin
              </span>
              <p className="font-black text-sky-950 text-sm sm:text-base mt-0.5">
                {data.summary.izin}
              </p>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-amber-50 to-amber-100/70 border border-amber-300 border-b-2 border-b-amber-500 rounded-xl shadow-2xs">
              <span className="font-extrabold text-[10px] sm:text-xs text-amber-800 uppercase tracking-wide">
                Sakit
              </span>
              <p className="font-black text-amber-950 text-sm sm:text-base mt-0.5">
                {data.summary.sakit}
              </p>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-purple-50 to-purple-100/70 border border-purple-300 border-b-2 border-b-purple-500 rounded-xl shadow-2xs">
              <span className="font-extrabold text-[10px] sm:text-xs text-purple-800 uppercase tracking-wide">
                Uzur
              </span>
              <p className="font-black text-purple-950 text-sm sm:text-base mt-0.5">
                {data.summary.uzur}
              </p>
            </div>
          </div>

          {/* Riwayat Absensi Terakhir */}
          <div>
            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Riwayat 15 Absensi Terakhir</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                total {data.history.length} catatan
              </span>
            </h5>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              {data.history.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada catatan riwayat absensi untuk murid ini.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Solat</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.history.slice(0, 15).map((h) => {
                      const isHadir = h.status === 'Hadir';
                      const isAlfa = h.status === 'Tidak Hadir';
                      const isIzin = h.status === 'Izin';
                      const isSakit = h.status === 'Sakit';

                      return (
                        <tr key={h.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700">
                            {new Date(h.attendance_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{h.prayer_name}</td>
                          <td className="py-2 px-3 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] inline-block ${
                                isHadir
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isAlfa
                                  ? 'bg-rose-100 text-rose-800'
                                  : isIzin
                                  ? 'bg-sky-100 text-sky-800'
                                  : isSakit
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {h.status === 'Tidak Hadir' ? 'Alfa' : h.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 italic">
                            {h.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  const s = data.student;
                  onClose();
                  onEdit(s);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Data Siswa</span>
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/20 ring-1 ring-white/15 cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-600">Data murid tidak ditemukan</p>
        </div>
      )}
    </Modal>
  );
};
