import React, { useState } from 'react';
import {
  Moon,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckSquare,
  Square,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AppLogo } from '../components/AppLogo.tsx';
import {
  validateSchoolCategory,
  detectLevelFromName,
  SCHOOL_LEVELS,
  SchoolLevel,
} from '../utils/schoolValidation.ts';

interface LoginProps {
  onSuccess: () => void;
}

const AVAILABLE_PRAYERS = [
  { id: 'Subuh', label: 'Solat Subuh', desc: 'Sebelum terbit fajar' },
  { id: 'Zuhur', label: 'Solat Zuhur', desc: 'Tengah hari / waktu istirahat' },
  { id: 'Asar', label: 'Solat Asar', desc: 'Sore hari menjelang kepulangan' },
  { id: 'Maghrib', label: 'Solat Maghrib', desc: 'Saat matahari terbenam (Boarding)' },
  { id: 'Isya', label: 'Solat Isya', desc: 'Malam hari (Boarding / Kegiatan Malam)' },
  { id: 'Dhuha', label: 'Solat Dhuha', desc: 'Pagi hari / pembiasaan ibadah' },
];

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register form state (kosong secara default)
  const [schoolName, setSchoolName] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('SD');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedPrayers, setSelectedPrayers] = useState<string[]>(['Zuhur', 'Asar']);

  const handleTogglePrayer = (prayerName: string) => {
    if (selectedPrayers.includes(prayerName)) {
      if (selectedPrayers.length === 1) {
        setError('Pilih minimal 1 jenis solat untuk sistem absensi.');
        return;
      }
      setSelectedPrayers(selectedPrayers.filter((p) => p !== prayerName));
    } else {
      setSelectedPrayers([...selectedPrayers, prayerName]);
    }
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Harap isi username/email dan password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      login(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setError('Nama sekolah wajib diisi.');
      return;
    }

    const valResult = validateSchoolCategory(schoolName, schoolLevel);
    if (!valResult.valid) {
      setError(valResult.error || 'Nama sekolah dan kategori jenjang tidak sesuai.');
      return;
    }

    if (!regUsername.trim() || !regPassword) {
      setError('Username dan password wajib diisi.');
      return;
    }
    if (selectedPrayers.length === 0) {
      setError('Silakan pilih minimal 1 waktu solat yang ingin diabsen di aplikasi.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.register({
        school_name: schoolName.trim(),
        school_level: valResult.normalizedLevel,
        username: regUsername.trim(),
        password: regPassword,
        prayers: selectedPrayers,
      });

      login(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 flex flex-col justify-center items-center relative py-6 px-4">
      {/* Garis Aksen Paling Atas */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-full fixed top-0 left-0 right-0 z-20" />

      <div className="w-full max-w-lg p-2 sm:p-4 my-auto">
        {/* App Logo & Header: Konsisten SIAS - Sistem Informasi Absensi Solat */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <AppLogo className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl shadow-emerald-950/80 ring-4 ring-emerald-500/20 rounded-3xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wider leading-none">
            SIAS
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300 font-medium tracking-tight mt-1.5">
            Sistem Informasi Absensi Solat
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-950/40 p-5 sm:p-8 border border-slate-100">
          {/* Segmented Switch: Masuk vs Registrasi Guru Baru */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-slate-800 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span>Registrasi Guru Baru</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* TAB 1: MASUK */
            <div>
              <div className="mb-5">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Masuk ke Dashboard</h2>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin atau penilai"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Memverifikasi...</span>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* TAB 2: REGISTRASI GURU / PENGGUNA BARU */
            <div>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Nama Sekolah & Jenjang */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                      Nama Sekolah <span className="text-rose-500">*</span>
                    </label>
                    {(() => {
                      const detected = detectLevelFromName(schoolName);
                      return detected ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          Terdeteksi: {SCHOOL_LEVELS[detected].title}
                        </span>
                      ) : null;
                    })()}
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
                        const detected = detectLevelFromName(val);
                        if (detected && detected !== schoolLevel) {
                          setSchoolLevel(detected);
                        }
                      }}
                      placeholder="Contoh: SD Negeri 3, SMP Negeri 1, SMA Negeri 1..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Kategori Jenjang Sekolah (1 dari 3: SD, SMP, SMA) */}
                <div>
                  {(() => {
                    const detected = detectLevelFromName(schoolName);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700 tracking-wide flex items-center space-x-1.5">
                            <span>Kategori Jenjang Sekolah</span>
                            <span className="text-rose-500">*</span>
                            {detected && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md flex items-center space-x-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Terkunci</span>
                              </span>
                            )}
                          </label>
                          <span className="text-[10.5px] font-bold text-emerald-800">
                            {SCHOOL_LEVELS[schoolLevel].grades}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['SD', 'SMP', 'SMA'] as SchoolLevel[]).map((levelKey) => {
                            const isSelected = schoolLevel === levelKey;
                            const isLockedOther = Boolean(detected && detected !== levelKey);
                            const info = SCHOOL_LEVELS[levelKey];
                            return (
                              <button
                                key={levelKey}
                                type="button"
                                disabled={isLockedOther}
                                onClick={() => {
                                  if (isLockedOther) return;
                                  setSchoolLevel(levelKey);
                                }}
                                title={
                                  isLockedOther
                                    ? `Terkunci: nama sekolah sudah terdeteksi sebagai ${SCHOOL_LEVELS[detected!].title}`
                                    : info.title
                                }
                                className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                                  isLockedOther
                                    ? 'opacity-35 bg-slate-100 text-slate-400 border-dashed border-slate-300 cursor-not-allowed select-none'
                                    : isSelected
                                    ? 'bg-[#063826] text-white border-[#063826] shadow-xs font-bold ring-1 ring-emerald-500/30 cursor-pointer'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs font-bold leading-tight">{info.title}</span>
                                  {isLockedOther && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                </div>
                                <span
                                  className={`text-[9.5px] mt-0.5 ${
                                    isLockedOther ? 'text-slate-400' : isSelected ? 'text-emerald-200' : 'text-slate-400'
                                  }`}
                                >
                                  {isLockedOther ? 'Terkunci' : info.grades}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {detected && (
                          <p className="text-[10px] text-amber-700 mt-1 flex items-center space-x-1">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>Nama sekolah mengandung kata kunci <strong>{detected}</strong>. Jenjang lain dinonaktifkan otomatis.</span>
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Sistem Absensi Solat Yang Diabsen */}
                <div>
                  <div className="mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                      Sistem Absensi Solat Yang Diabsen <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {AVAILABLE_PRAYERS.map((prayer) => {
                      const isSelected = selectedPrayers.includes(prayer.id);
                      return (
                        <div
                          key={prayer.id}
                          onClick={() => handleTogglePrayer(prayer.id)}
                          className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold block">{prayer.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nama Pengguna Guru Penilai */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                    Nama Pengguna (Penilai)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 tracking-wide mb-1">
                        Username Login
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="penilai"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 tracking-wide mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] text-white font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-950/25 ring-1 ring-white/15 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Menyiapkan Sistem & Akun...</span>
                  ) : (
                    <>
                      <span>Mulai & Terapkan Pilihan Solat</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
