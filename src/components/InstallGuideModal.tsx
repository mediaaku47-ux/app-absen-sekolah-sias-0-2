import React, { useState } from 'react';
import { X, Laptop, Smartphone, Apple, ArrowRight, Download, CheckCircle2, ChevronRight } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToApp?: () => void;
  onDirectInstall?: () => Promise<unknown> | unknown;
  isInstallable?: boolean;
  defaultTab?: 'laptop' | 'android' | 'ios';
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  onContinueToApp,
  onDirectInstall,
  isInstallable = false,
  defaultTab = 'laptop',
}) => {
  const [activeTab, setActiveTab] = useState<'laptop' | 'android' | 'ios'>(defaultTab);

  if (!isOpen) return null;

  const handleContinue = () => {
    onClose();
    if (onContinueToApp) {
      onContinueToApp();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#063826] via-[#094230] to-[#0d5940] p-4 sm:p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={handleContinue}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/90 transition-all cursor-pointer"
            title="Tutup panduan"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-192.png"
              alt="Logo SIAS"
              className="w-11 h-11 rounded-xl shadow-md border border-white/20 object-contain bg-white/10 shrink-0"
            />
            <div className="min-w-0 pr-8">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Tutorial Singkat
              </span>
              <h3 className="font-outfit font-black text-base sm:text-lg text-white leading-tight">
                Cara Download & Pasang SIAS di Chrome
              </h3>
              <p className="font-jakarta text-[11px] sm:text-xs text-emerald-100/80 mt-0.5">
                Langsung pasang di perangkat Anda tanpa perlu install lewat toko aplikasi.
              </p>
            </div>
          </div>

          {/* Tab Navigation: Laptop vs HP Android vs iPhone */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 rounded-xl bg-black/25">
            <button
              type="button"
              onClick={() => setActiveTab('laptop')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'laptop'
                  ? 'bg-white text-[#063826] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Laptop / PC</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-[#063826] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>HP Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-[#063826] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
          </div>
        </div>

        {/* Isi Panduan Berdasarkan Tab */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 font-jakarta text-xs sm:text-[13px]">
          {/* TAB 1: LAPTOP / PC (CHROME) */}
          {activeTab === 'laptop' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-center gap-2">
                <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                  Chrome PC
                </span>
                <span className="text-[12px] font-medium leading-snug">
                  Cukup 3 langkah mudah langsung dari browser Google Chrome di Laptop.
                </span>
              </div>

              {/* Langkah 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Lihat Kolom Alamat URL Chrome (Atas Kanan)
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Perhatikan di sebelah kanan kolom tempat mengetik link web, cari ikon{' '}
                    <strong className="text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded">
                      "Instal" (ikon layar komputer dengan panah ke bawah ⬇️)
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Atau Lewat Menu Titik Tiga (⋮) Chrome
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Jika ikon tidak muncul: Klik tanda <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome &gt;
                    Pilih <strong>"Simpan dan bagikan"</strong> (atau "Cast, simpan, dan bagikan") &gt; Klik{' '}
                    <strong>"Instal SIAS..."</strong>.
                  </p>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Klik Tombol "Instal"
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Jendela konfirmasi kecil akan muncul. Klik <strong>"Instal"</strong>. Ikon SIAS otomatis tersimpan di{' '}
                    <strong>Desktop</strong> & <strong>Taskbar</strong> laptop Anda.
                  </p>
                </div>
              </div>

              {/* Keuntungan */}
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Setelah terpasang, SIAS terbuka di jendela aplikasi terpisah tanpa tab browser.</span>
              </div>
            </div>
          )}

          {/* TAB 2: HP ANDROID (CHROME) */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 flex items-center gap-2">
                <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-teal-600 text-white shrink-0">
                  Chrome HP
                </span>
                <span className="text-[12px] font-medium leading-snug">
                  Pasang langsung di menu HP Android seperti aplikasi Play Store.
                </span>
              </div>

              {/* Langkah 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Ketuk Menu Titik Tiga (⋮) di Chrome HP
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Saat membuka SIAS di browser Chrome HP, ketuk ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas layar.
                  </p>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Pilih Menu "Instal Aplikasi" / "Tambahkan ke Layar Utama"
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Gulir daftar menu ke bawah dan ketuk opsi{' '}
                    <strong className="text-teal-800 bg-teal-100/80 px-1 py-0.5 rounded">
                      "Instal aplikasi"
                    </strong>{' '}
                    atau{' '}
                    <strong className="text-teal-800 bg-teal-100/80 px-1 py-0.5 rounded">
                      "Tambahkan ke Layar Utama"
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Ketuk "Instal" / "Tambah"
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Tunggu 2-3 detik. Ikon SIAS langsung muncul di layar utama HP Anda dengan logo resmi SIAS.
                  </p>
                </div>
              </div>

              {/* Keuntungan */}
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Bisa dibuka satu kali sentuh, cepat, dan bekerja secara offline saat jaringan minim.</span>
              </div>
            </div>
          )}

          {/* TAB 3: IPHONE / IPAD (SAFARI) */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 flex items-center gap-2">
                <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                  Safari iOS
                </span>
                <span className="text-[12px] font-medium leading-snug">
                  Khusus iPhone dan iPad menggunakan browser Safari.
                </span>
              </div>

              {/* Langkah 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Ketuk Tombol Share / Bagikan (📤)
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Buka link ini di browser Safari, lalu ketuk ikon <strong>Bagikan</strong> (kotak dengan panah ke atas) di bagian bawah layar.
                  </p>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Pilih "Tambahkan ke Layar Utama"
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Gulir opsi ke bawah lalu pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    Ketuk "Tambah" di Pojok Kanan Atas
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Aplikasi SIAS langsung muncul di layar utama iPhone / iPad Anda.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          {/* Tombol Coba Pasang Otomatis jika browser mendukung */}
          {isInstallable && onDirectInstall && (
            <button
              type="button"
              onClick={async () => {
                await onDirectInstall();
                handleContinue();
              }}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-[13px] shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Coba Pasang Otomatis (1-Klik)</span>
            </button>
          )}

          {/* Tombol Lanjut ke Aplikasi */}
          <button
            type="button"
            onClick={handleContinue}
            className={`w-full ${
              isInstallable && onDirectInstall ? 'sm:w-auto' : 'flex-1'
            } py-2.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all`}
          >
            <span>Lanjut ke Aplikasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
