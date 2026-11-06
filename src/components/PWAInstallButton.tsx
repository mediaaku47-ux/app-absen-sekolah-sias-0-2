import React, { useState } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Jika sudah terpasang atau ditutup sementara oleh pengguna, sembunyikan
  if (isInstalled || isDismissed) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="mx-4 my-2 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/assets/logo-192.png"
            alt="Logo SIAS"
            className="w-10 h-10 rounded-xl shadow-md border border-white/20 shrink-0 object-contain bg-white/10"
          />
          <div className="min-w-0">
            <h4 className="font-outfit font-black text-xs sm:text-sm text-white tracking-tight truncate">
              Pasang Aplikasi SIAS
            </h4>
            <p className="font-jakarta text-[11px] text-emerald-200/90 truncate">
              Bisa di-download di Chrome seperti aplikasi Android
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="mx-4 my-2 p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/logo-192.png"
              alt="Logo SIAS"
              className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-contain bg-white/10 border border-white/10"
            />
            <div className="min-w-0">
              <h4 className="font-outfit font-bold text-xs text-white truncate">
                Tambahkan SIAS ke Layar Utama
              </h4>
              <p className="font-jakarta text-[10px] text-slate-400 truncate">
                Akses cepat seperti aplikasi di iPhone / iPad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pasang</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/assets/logo-192.png" alt="Logo SIAS" className="w-8 h-8 rounded-lg" />
                  <h3 className="font-outfit font-black text-base text-slate-900">
                    Pasang SIAS di iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p>Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah browser Safari.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <p>Gulir ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <p>Tekan <strong>Tambah</strong> di pojok kanan atas. Ikon aplikasi SIAS akan otomatis muncul di layar HP Anda!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white cursor-pointer shadow-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
