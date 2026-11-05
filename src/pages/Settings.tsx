import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Building2,
  CheckSquare,
  Square,
  Save,
  Sparkles,
  Lock,
  X,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Header } from '../components/Header.tsx';
import { PrayerType } from '../types.ts';
import {
  validateSchoolCategory,
  detectLevelFromName,
  SCHOOL_LEVELS,
  SchoolLevel,
} from '../utils/schoolValidation.ts';

export const Settings: React.FC = () => {
  // School & Prayer System configuration
  const [schoolName, setSchoolName] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<'SD' | 'SMP' | 'SMA'>('SMA');
  const [systemTitle, setSystemTitle] = useState('Sistem Informasi Absensi Solat');
  const [allPrayers, setAllPrayers] = useState<PrayerType[]>([]);
  const [selectedPrayers, setSelectedPrayers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Nilai awal untuk mendeteksi perubahan (dirty tracking)
  const [initialSchoolName, setInitialSchoolName] = useState('');
  const [initialSchoolLevel, setInitialSchoolLevel] = useState<'SD' | 'SMP' | 'SMA'>('SMA');
  const [initialPrayers, setInitialPrayers] = useState<string[]>([]);

  // Otomatis hilangkan notifikasi setelah 8 detik
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [message]);


  useEffect(() => {
    // Load app settings
    api.getAppSettings().then((s) => {
      const sName = s.school_name || '';
      const sLevel = (s.school_level as any) || 'SMA';
      setSchoolName(sName);
      setInitialSchoolName(sName);
      setSchoolLevel(sLevel);
      setInitialSchoolLevel(sLevel);
      if (s.system_title) setSystemTitle(s.system_title);
    }).catch(console.error);

    // Load prayers
    api.getPrayerTypes().then((list) => {
      setAllPrayers(list);
      const active = list.filter((p) => p.is_active === 1).map((p) => p.name);
      setSelectedPrayers(active);
      setInitialPrayers(active);
    }).catch(console.error);
  }, []);

  const togglePrayerSelection = (prayerName: string) => {
    setIsDirty(true);
    if (selectedPrayers.includes(prayerName)) {
      if (selectedPrayers.length === 1) {
        setMessage({ type: 'error', text: 'Minimal 1 solat harus tetap aktif' });
        return;
      }
      setSelectedPrayers(selectedPrayers.filter((p) => p !== prayerName));
    } else {
      setSelectedPrayers([...selectedPrayers, prayerName]);
    }
  };

  // Deteksi apakah ada perubahan sekecil apapun (walau hanya 1 hal yang diubah)
  const isPrayersChanged =
    selectedPrayers.length !== initialPrayers.length ||
    selectedPrayers.some((p) => !initialPrayers.includes(p)) ||
    initialPrayers.some((p) => !selectedPrayers.includes(p));

  const schoolValidation = validateSchoolCategory(schoolName, schoolLevel);

  const hasChanges =
    isDirty ||
    schoolName.trim() !== initialSchoolName.trim() ||
    schoolLevel !== initialSchoolLevel ||
    isPrayersChanged;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validasi kesesuaian nama sekolah dan kategori jenjang (SD, SMP, atau SMA)
    if (!schoolValidation.valid) {
      setMessage({
        type: 'error',
        text: schoolValidation.error || 'Nama sekolah dan kategori jenjang tidak sesuai',
      });
      scrollToTop();
      return;
    }

    if (selectedPrayers.length === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal 1 waktu solat yang aktif' });
      scrollToTop();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Simpan pengaturan sekolah, jenjang, & pilihan solat
      await api.updateAppSetup({
        school_name: schoolName.trim(),
        school_level: schoolLevel,
        system_title: systemTitle.trim(),
        prayers: selectedPrayers,
      });

      // Simpan di localStorage & trigger sync event
      localStorage.setItem('sias_permanent_prayers', JSON.stringify(selectedPrayers));
      const updatedPrayers = await api.getPrayerTypes();
      setAllPrayers(updatedPrayers);
      const active = updatedPrayers.filter((p) => p.is_active === 1).map((p) => p.name);
      setSelectedPrayers(active);
      setInitialPrayers(active);
      setInitialSchoolName(schoolName.trim());
      setInitialSchoolLevel(schoolLevel);
      setIsDirty(false);

      window.dispatchEvent(new CustomEvent('settings_updated'));

      setMessage({
        type: 'success',
        text: 'Perubahan nama sekolah, jenjang, dan pengaturan berhasil disimpan ke sistem.',
      });
      scrollToTop();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan' });
      scrollToTop();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16 lg:pb-8 bg-slate-50 min-h-screen">
      <Header
        title="Pengaturan Aplikasi"
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {message && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md flex items-start gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300 ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/25'
                : 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-500/25'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 shadow-xs ${
                message.type === 'success'
                  ? 'bg-emerald-600 text-white shadow-emerald-700/20'
                  : 'bg-rose-600 text-white shadow-rose-700/20'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-outfit font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  {message.type === 'success' ? 'Pengaturan Berhasil Disimpan!' : 'Perhatian'}
                </h4>
                {message.type === 'success' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    Tersimpan
                  </span>
                )}
              </div>
              <p className="font-jakarta text-xs sm:text-sm text-slate-700 mt-1 font-semibold leading-relaxed">
                {message.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
              title="Tutup pesan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSaveAllSettings} className="space-y-6">
          {/* Card 1: Pengaturan Sekolah & Sistem Pilihan Solat */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-outfit block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Nama Sekolah
                </label>
                {schoolValidation.detectedLevel && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Terdeteksi: {SCHOOL_LEVELS[schoolValidation.detectedLevel].title}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSchoolName(val);
                    setIsDirty(true);
                    // Otomatis sinkronkan jenjang jika kata kunci nama sekolah terdeteksi
                    const detected = detectLevelFromName(val);
                    if (detected && detected !== schoolLevel) {
                      setSchoolLevel(detected);
                    }
                  }}
                  placeholder="Contoh: SD Negeri 3 Dendang, SMP Negeri 1, SMA Negeri 1..."
                  className={`font-jakarta w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border ${
                    !schoolValidation.valid
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-slate-300 focus:ring-emerald-500'
                  } rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:bg-white`}
                />
              </div>

              {/* Alert jika terjadi ketidaksesuaian nama dan kategori */}
              {!schoolValidation.valid && schoolValidation.error && (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold leading-relaxed">{schoolValidation.error}</p>
                    {schoolValidation.detectedLevel && (
                      <button
                        type="button"
                        onClick={() => {
                          setSchoolLevel(schoolValidation.detectedLevel!);
                          setIsDirty(true);
                        }}
                        className="mt-1.5 inline-flex items-center text-xs font-bold text-rose-900 underline hover:no-underline cursor-pointer"
                      >
                        → Ubah kategori jenjang ke {SCHOOL_LEVELS[schoolValidation.detectedLevel].title}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Jenjang Sekolah (Strict 3 Kategori: SD, SMP, SMA) */}
            <div>
              <div className="mb-1.5">
                <label className="font-outfit block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Kategori Jenjang Sekolah
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {(['SD', 'SMP', 'SMA'] as SchoolLevel[]).map((levelKey) => {
                  const isSelected = schoolLevel === levelKey;
                  const isLockedOther = Boolean(
                    schoolValidation.detectedLevel && schoolValidation.detectedLevel !== levelKey
                  );
                  const info = SCHOOL_LEVELS[levelKey];
                  return (
                    <button
                      key={levelKey}
                      type="button"
                      disabled={isLockedOther}
                      onClick={() => {
                        if (isLockedOther) return;
                        setSchoolLevel(levelKey);
                        setIsDirty(true);
                      }}
                      title={
                        isLockedOther
                          ? `Tidak dapat diklik karena nama sekolah sudah terdeteksi sebagai jenjang ${SCHOOL_LEVELS[schoolValidation.detectedLevel!].title}`
                          : info.title
                      }
                      className={`h-14 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center font-outfit ${
                        isLockedOther
                          ? 'opacity-35 bg-slate-100 text-slate-400 border-dashed border-slate-300 cursor-not-allowed select-none'
                          : isSelected
                          ? 'bg-gradient-to-br from-[#063826] to-[#0d5940] text-white border-[#063826] shadow-sm font-bold ring-2 ring-emerald-500/30 cursor-pointer'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold">{info.title}</span>
                        {isLockedOther && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <span
                        className={`text-[10px] ${
                          isLockedOther ? 'text-slate-400' : isSelected ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        {isLockedOther ? 'Terkunci' : info.grades}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waktu Solat yang Diabsen */}
            <div>
              <div className="mb-2.5">
                <label className="font-outfit block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Waktu Solat yang Diabsen di Aplikasi
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allPrayers.map((p) => {
                  const isChecked = selectedPrayers.includes(p.name);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePrayerSelection(p.name)}
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center space-x-2.5 ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs truncate">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



          {/* Tombol Simpan Perubahan hanya muncul jika terdapat perubahan data */}
          {hasChanges && (
            <div className="pt-2 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isLoading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
