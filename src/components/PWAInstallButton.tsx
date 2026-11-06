import React, { useState } from 'react';
import { Download, X, HelpCircle, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { InstallGuideModal } from './InstallGuideModal.tsx';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Jika sudah terpasang atau ditutup sementara oleh pengguna, sembunyikan banner
  if (isInstalled || isDismissed) {
    return (
      <InstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onDirectInstall={isInstallable ? install : undefined}
        isInstallable={isInstallable}
        defaultTab={isIOS ? 'ios' : 'laptop'}
      />
    );
  }

  return (
    <>
      <div className="mx-4 my-2 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-950 via-[#063826] to-slate-900 border border-emerald-500/30 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/assets/logo-192.png"
            alt="Logo SIAS"
            className="w-10 h-10 rounded-xl shadow-md border border-white/20 shrink-0 object-contain bg-white/10"
          />
          <div className="min-w-0">
            <h4 className="font-outfit font-black text-xs sm:text-sm text-white tracking-tight truncate flex items-center gap-1.5">
              <span>Pasang SIAS di Chrome</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                Laptop & HP
              </span>
            </h4>
            <p className="font-jakarta text-[11px] text-emerald-200/90 truncate">
              Klik untuk melihat panduan langkah cepat pasang aplikasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Panduan Pasang</span>
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

      {/* Modal Panduan Lengkap Download di Chrome */}
      <InstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onDirectInstall={isInstallable ? install : undefined}
        isInstallable={isInstallable}
        defaultTab={isIOS ? 'ios' : 'laptop'}
      />
    </>
  );
};
