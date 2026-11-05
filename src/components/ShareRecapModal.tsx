import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  School,
  Calendar,
} from 'lucide-react';
import { DashboardStats, ClassItem } from '../types.ts';

interface ShareRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats | null;
  classList: ClassItem[];
  selectedDate: string;
}

export const ShareRecapModal: React.FC<ShareRecapModalProps> = ({
  isOpen,
  onClose,
  stats,
  classList,
  selectedDate,
}) => {
  const [targetClassId, setTargetClassId] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const schoolName = stats?.school_name || 'SMP Islam Terpadu Al-Hikmah';
  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  // Cari data kelas terpilih
  const selectedClass =
    targetClassId === 'all'
      ? null
      : classList.find((c) => String(c.id) === String(targetClassId));

  const classStatData =
    targetClassId === 'all'
      ? null
      : stats?.classStats?.find((c) => String(c.id) === String(targetClassId));

  const total =
    targetClassId === 'all' ? stats?.today?.total || 0 : classStatData?.total || 0;
  const hadir =
    targetClassId === 'all' ? stats?.today?.hadir || 0 : classStatData?.hadir || 0;
  const izin =
    targetClassId === 'all' ? stats?.today?.izin || 0 : classStatData?.izin || 0;
  const sakit =
    targetClassId === 'all' ? stats?.today?.sakit || 0 : classStatData?.sakit || 0;
  const tidakHadir =
    targetClassId === 'all'
      ? stats?.today?.tidakHadir || 0
      : classStatData?.tidak_hadir || 0;
  const uzur =
    targetClassId === 'all' ? stats?.today?.uzur || 0 : classStatData?.uzur || 0;

  const percentage =
    total > 0 ? Math.round((hadir / total) * 100) : 0;

  const classNameText = selectedClass ? selectedClass.name : 'Seluruh Kelas';

  // Susun template pesan rapi untuk WhatsApp / Telegram / SMS
  const recapMessage = `🕌 *REKAP PRESENSI SALAT SISWA*
🏫 *${schoolName}*
━━━━━━━━━━━━━━━━━━━━
📅 *Hari/Tanggal:* ${formattedDate}
👥 *Target:* ${classNameText}

📊 *RINGKASAN KEHADIRAN:*
• Total Presensi: *${total}* data
• Hadir: *${hadir}* siswa (${percentage}%)
• Izin: *${izin}* siswa
• Sakit: *${sakit}* siswa
• Alfa / Tanpa Keterangan: *${tidakHadir}* siswa${uzur > 0 ? `\n• Uzur Syar'i: *${uzur}* siswi` : ''}

⭐ *Tingkat Kehadiran:* *${percentage}%*
━━━━━━━━━━━━━━━━━━━━
_Catatan untuk Bapak/Ibu Wali Kelas & Guru Pembimbing:_
Mohon kerja samanya untuk terus memotivasi ananda agar senantiasa istiqomah menjaga salat berjemaah di sekolah.

Terima kasih.
_Wassalamu'alaikum Warahmatullahi Wabarakatuh_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(recapMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(recapMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                Kirim Rekap ke Wali Kelas
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Format otomatis siap bagikan melalui WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* Pilih Kelas Penerima */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Target Kelas Rekap:
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">🌐 Seluruh Kelas (Ringkasan Sekolah)</option>
              {classList.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  🏫 Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Box Pesan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Pesan Rekap:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {recapMessage.length} karakter
              </span>
            </div>

            <div className="bg-slate-900 text-emerald-100 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800 shadow-inner select-all whitespace-pre-wrap">
              {recapMessage}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Teks Rekap</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Bagikan via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
