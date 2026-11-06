import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User as UserIcon,
  School,
  Check,
  Sparkles,
  GraduationCap,
  Download,
  Globe,
  X,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { api } from '../services/api.ts';
import { AppLogo } from '../components/AppLogo.tsx';
import {
  validateSchoolCategory,
  detectLevelFromName,
  SCHOOL_LEVELS,
  SchoolLevel,
} from '../utils/schoolValidation.ts';

interface AuthFlowProps {
  onSuccess?: () => void;
  initialScreen?: 'welcome' | 'login' | 'register';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess, initialScreen = 'welcome' }) => {
  const { user, login } = useAuth();
  const [activeScreen, setActiveScreen] = useState<'welcome' | 'login' | 'register'>(initialScreen);

  // Form states untuk Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // PWA Install prompt state
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  const handleStartClick = () => {
    // Jika aplikasi sudah berjalan dalam mode PWA terpasang, langsung ke halaman login
    if (isInstalled) {
      setActiveScreen('login');
      return;
    }
    // Tampilkan popup opsi menginstal aplikasi atau lanjut di Chrome
    setShowInstallDialog(true);
  };

  const handleChooseInstall = async () => {
    setShowInstallDialog(false);
    if (isIOS) {
      setShowIOSInstallGuide(true);
      return;
    }
    // Pemicu unduhan langsung melalui dialog instalasi resmi browser
    if (isInstallable) {
      await install();
    }
    setActiveScreen('login');
  };

  const handleChooseContinueBrowser = () => {
    setShowInstallDialog(false);
    setActiveScreen('login');
  };

  // Form states untuk Register (Pengguna Baru)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regSchoolLevel, setRegSchoolLevel] = useState<'SD' | 'SMP' | 'SMA'>('SMA');
  const [regPrayers, setRegPrayers] = useState<string[]>(['Zuhur', 'Asar']);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regNameError, setRegNameError] = useState('');
  const [regEmailError, setRegEmailError] = useState('');
  const [regPasswordError, setRegPasswordError] = useState('');
  const [regConfirmError, setRegConfirmError] = useState('');
  const [regSchoolNameError, setRegSchoolNameError] = useState('');
  const [regGeneralError, setRegGeneralError] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Validasi Email & Password Login
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email tidak boleh kosong');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed) && trimmed.toLowerCase() !== 'admin') {
      setEmailError('Format email tidak valid (contoh: nama@gmail.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password tidak boleh kosong');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      login(res.token, res.user);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Email atau password salah. Periksa kembali akun Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validasi Register (Pengguna Baru)
  const validateRegName = (val: string): boolean => {
    if (!val.trim()) {
      setRegNameError('Nama lengkap harus diisi');
      return false;
    }
    setRegNameError('');
    return true;
  };

  const validateRegEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setRegEmailError('Email tidak boleh kosong');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setRegEmailError('Format email tidak valid (contoh: nama@gmail.com)');
      return false;
    }
    setRegEmailError('');
    return true;
  };

  const validateRegPassword = (val: string): boolean => {
    if (!val) {
      setRegPasswordError('Password tidak boleh kosong');
      return false;
    }
    if (val.length < 6) {
      setRegPasswordError('Password minimal 6 karakter');
      return false;
    }
    setRegPasswordError('');
    return true;
  };

  const validateRegConfirm = (val: string, pass: string): boolean => {
    if (!val) {
      setRegConfirmError('Konfirmasi password tidak boleh kosong');
      return false;
    }
    if (val !== pass) {
      setRegConfirmError('Konfirmasi password tidak cocok');
      return false;
    }
    setRegConfirmError('');
    return true;
  };

  const validateRegSchoolName = (val: string, level: SchoolLevel = regSchoolLevel): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setRegSchoolNameError('Nama sekolah harus diisi');
      return false;
    }
    const valResult = validateSchoolCategory(trimmed, level);
    if (!valResult.valid) {
      setRegSchoolNameError(valResult.error || 'Nama sekolah dan kategori jenjang tidak sesuai');
      return false;
    }
    setRegSchoolNameError('');
    return true;
  };

  const toggleRegPrayer = (prayerName: string) => {
    setRegPrayers((prev) => {
      if (prev.includes(prayerName)) {
        if (prev.length <= 1) return prev; // Minimal 1 solat
        return prev.filter((p) => p !== prayerName);
      } else {
        return [...prev, prayerName];
      }
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegGeneralError('');

    const isNameOk = validateRegName(regName);
    const isEmailOk = validateRegEmail(regEmail);
    const isPassOk = validateRegPassword(regPassword);
    const isConfirmOk = validateRegConfirm(regConfirmPassword, regPassword);
    const isSchoolOk = validateRegSchoolName(regSchoolName, regSchoolLevel);

    if (!isNameOk || !isEmailOk || !isPassOk || !isConfirmOk || !isSchoolOk) {
      return;
    }

    const schoolValidation = validateSchoolCategory(regSchoolName, regSchoolLevel);
    if (!schoolValidation.valid) {
      setRegSchoolNameError(schoolValidation.error || 'Nama sekolah dan kategori jenjang tidak sesuai');
      return;
    }

    if (regPrayers.length === 0) {
      setRegGeneralError('Pilih minimal satu waktu solat yang hendak diabsen');
      return;
    }

    setIsRegLoading(true);
    try {
      const res = await api.registerTeacher({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        school_name: regSchoolName.trim(),
        school_level: schoolValidation.normalizedLevel,
        prayers: regPrayers,
      });
      login(res.token, res.user);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setRegGeneralError(err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
    } finally {
      setIsRegLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;
  const isRegFormValid =
    regName.trim().length > 0 &&
    regEmail.trim().length > 0 &&
    regSchoolName.trim().length > 0 &&
    regPrayers.length > 0 &&
    regPassword.length >= 6 &&
    regConfirmPassword === regPassword;

  return (
    <div className="min-h-screen bg-[#031c13] sm:bg-[#02130d] flex items-center justify-center p-0 sm:p-4 font-poppins select-none antialiased">
      {/* Mobile Frame Container: Rasio Portrait Mobile 360x800 dengan latar perpaduan Hijau Gelap & Biru */}
      <div className="w-full max-w-[400px] min-h-screen sm:min-h-[780px] sm:max-h-[860px] bg-gradient-to-b from-[#063826] via-[#092f33] to-[#0f172a] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300">
        
        {/* Tombol kembali ke dashboard jika sudah login */}
        {user && (
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="fixed top-4 right-4 z-50 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center space-x-1.5"
          >
            <span>Kembali ke Aplikasi</span>
            <span>→</span>
          </button>
        )}

        {/* Viewport Layar Geser Transisi Premium (Ultra-Smooth 3-Panel Sliding Track) */}
        <div className="relative w-full flex-1 overflow-hidden flex flex-col">
          <div
            className={`flex w-[300%] flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              activeScreen === 'welcome'
                ? 'translate-x-0'
                : activeScreen === 'login'
                ? '-translate-x-1/3'
                : '-translate-x-2/3'
            }`}
          >
            {/* ======================================================== */}
            {/* PANEL 1: HALAMAN MULAI (WELCOME SCREEN)                  */}
            {/* ======================================================== */}
            <div
              className={`w-1/3 flex flex-col justify-between shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeScreen === 'welcome'
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-[0.96] pointer-events-none'
              }`}
            >
              {/* Bagian Atas: Background Hijau Gelap & Biru dengan Logo Awal Rata Tengah */}
              <div className="flex-1 flex flex-col items-center justify-center pt-16 sm:pt-20 pb-4 px-6 text-center relative">
                {/* Efek Cahaya Halus Hijau & Biru */}
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-4 -left-10 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Logo Awal Aplikasi Tepat di Tengah Atas */}
                <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl ring-2 ring-emerald-400/40 mb-5 p-2 relative z-10 mx-auto transition-transform duration-300 hover:scale-105">
                  <AppLogo className="w-full h-full rounded-2xl" />
                </div>

                {/* Nama App: SIAS (Rata Tengah) */}
                <h1 className="text-[26px] font-bold tracking-wider leading-tight bg-gradient-to-r from-white via-sky-200 to-emerald-300 bg-clip-text text-transparent relative z-10 text-center">
                  SIAS
                </h1>

                {/* Kepanjangan / Tagline SIAS: Poppins Regular ~13px Hijau Muda Lembut */}
                <p className="text-[13px] font-normal text-emerald-200/90 mt-2 max-w-[280px] leading-relaxed relative z-10 text-center mx-auto">
                  Sistem Informasi Absensi Solat
                </p>
              </div>

              {/* Bagian Bawah: Teks & Tombol Selaras Rata Tengah */}
              <div className="px-6 sm:px-8 pb-14 sm:pb-16 pt-2 flex flex-col justify-end relative z-20 text-center">
                <div className="text-center mb-7 flex flex-col items-center">
                  {/* Judul Utama: "Selamat Datang" */}
                  <h2 className="text-[22px] sm:text-[24px] font-bold text-white tracking-tight text-center">
                    Selamat Datang
                  </h2>

                  {/* Sub-Deskripsi */}
                  <p className="text-[13.5px] font-normal text-emerald-100/85 leading-relaxed mt-3.5 max-w-[310px] text-center mx-auto">
                    Solusi digital praktis bagi guru untuk melakukan absensi solat berjamaah.
                  </p>
                </div>

                {/* Tombol "Mulai" */}
                <button
                  type="button"
                  onClick={handleStartClick}
                  className="w-full h-12 bg-white hover:bg-emerald-50 active:scale-[0.98] text-[#063826] font-semibold text-[16px] tracking-wide rounded-xl shadow-xl shadow-black/25 transition-all duration-200 flex items-center justify-center cursor-pointer group"
                >
                  <span>Mulai</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200 text-emerald-700">→</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PANEL 2: HALAMAN LOGIN                                   */}
            {/* ======================================================== */}
            <div
              className={`w-1/3 flex flex-col justify-between shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeScreen === 'login'
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-[0.96] pointer-events-none'
              }`}
            >
              {/* Header Login */}
              <div className="pt-7 pb-6 px-6 sm:px-7 flex flex-col items-center justify-center min-h-[195px] relative text-center">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-2 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Tombol Kembali ke Halaman Mulai */}
                <button
                  type="button"
                  onClick={() => setActiveScreen('welcome')}
                  className="absolute left-5 top-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm z-20"
                  title="Kembali ke Halaman Mulai"
                  aria-label="Kembali ke Halaman Mulai"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Logo & Nama Aplikasi Terpusat di Tengah */}
                <div className="flex flex-col items-center justify-center text-center relative z-10 my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg ring-2 ring-emerald-400/40 p-1.5 mb-2 mx-auto transition-transform hover:scale-105 duration-200">
                    <AppLogo className="w-full h-full rounded-xl" />
                  </div>
                  <h1 className="text-[22px] sm:text-[24px] font-bold text-white tracking-tight leading-tight">
                    SIAS
                  </h1>
                  <p className="text-[12px] sm:text-[13px] font-medium text-emerald-100/90 mt-0.5">
                    Sistem Informasi Absensi Solat
                  </p>
                </div>
              </div>

              {/* Kartu Login Putih Bersih */}
              <div
                className={`bg-white rounded-t-[32px] pt-6 pb-7 px-6 sm:px-8 shadow-[0_-10px_35px_rgba(6,56,38,0.18)] flex-1 flex flex-col justify-between relative z-20 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeScreen === 'login' ? 'translate-y-0' : 'translate-y-4'
                }`}
              >
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[22px] sm:text-[24px] font-bold text-[#063826] tracking-tight">
                      Login
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">Akun Guru</span>
                  </div>

                  {generalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  {/* Field Email */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={() => validateEmail(email)}
                        placeholder="contoh@gmail.com"
                        className={`w-full h-12 pl-11 pr-4 bg-slate-50 border ${
                          emailError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                        } rounded-xl text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 pl-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Field Password */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) validatePassword(e.target.value);
                        }}
                        onBlur={() => validatePassword(password)}
                        placeholder="Password"
                        className={`w-full h-12 pl-11 pr-11 bg-slate-50 border ${
                          passwordError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                        } rounded-xl text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                        title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 pl-1">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Lupa Password */}
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      Lupa Password?
                    </button>
                  </div>

                  {/* Tombol Login */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={!isFormValid || isLoading}
                      className="w-full h-12 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[16px] tracking-wide rounded-xl border border-emerald-950/40 shadow-lg shadow-emerald-950/25 transition-all flex items-center justify-center cursor-pointer ring-1 ring-white/15"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        'Login'
                      )}
                    </button>
                  </div>
                </form>

                {/* Bagian Pengguna Baru: Tombol Tampilan Daftar Akun */}
                <div className="pt-4 pb-2 flex flex-col items-center">
                  <div className="relative w-full flex items-center justify-center mb-3">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-2.5 text-[11px] font-medium text-slate-400 absolute">
                      Belum memiliki akun?
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveScreen('register')}
                    className="w-full h-11.5 bg-slate-50 hover:bg-emerald-50/70 active:scale-[0.98] text-[#063826] font-semibold text-[14.5px] rounded-xl border-2 border-emerald-800/25 hover:border-emerald-700 shadow-xs transition-all duration-200 flex items-center justify-center cursor-pointer group"
                  >
                    <span>Daftar Akun Baru</span>
                    <span className="ml-1.5 text-emerald-700 font-bold group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PANEL 3: HALAMAN DAFTAR AKUN BARU (REGISTER)            */}
            {/* ======================================================== */}
            <div
              className={`w-1/3 flex flex-col justify-between shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeScreen === 'register'
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-[0.96] pointer-events-none'
              }`}
            >
              {/* Header Register */}
              <div className="pt-4 pb-3 px-6 sm:px-7 flex flex-col justify-between shrink-0 relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-2 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Tombol Kembali ke Halaman Login */}
                <button
                  type="button"
                  onClick={() => setActiveScreen('login')}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer mb-1 shadow-sm relative z-10"
                  title="Kembali ke Halaman Login"
                  aria-label="Kembali ke Halaman Login"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Logo & Teks Sambutan Register */}
                <div className="flex items-center space-x-3 mb-0.5 relative z-10">
                  <AppLogo className="w-10 h-10 rounded-2xl shadow-lg ring-2 ring-emerald-400/40 shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                      Daftar Akun Baru
                    </h1>
                    <p className="text-[12px] font-normal text-emerald-100/90 mt-0.5">
                      SIAS - Sistem Absensi Solat Sekolah
                    </p>
                  </div>
                </div>
              </div>

              {/* Kartu Register Putih Bersih */}
              <div
                className={`bg-white rounded-t-[32px] pt-5 pb-6 px-5 sm:px-7 shadow-[0_-10px_35px_rgba(6,56,38,0.18)] flex-1 flex flex-col justify-between relative z-20 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto max-h-[calc(100vh-140px)] sm:max-h-[700px] ${
                  activeScreen === 'register' ? 'translate-y-0' : 'translate-y-4'
                }`}
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <h2 className="text-[18px] font-bold text-[#063826] tracking-tight">
                      Registrasi Guru & Sekolah
                    </h2>
                  </div>

                  {regGeneralError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regGeneralError}</span>
                    </div>
                  )}

                  {/* BAGIAN 1: DATA GURU */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      1. Data Akun Guru
                    </div>

                    {/* Field Nama Lengkap */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => {
                            setRegName(e.target.value);
                            if (regNameError) validateRegName(e.target.value);
                          }}
                          onBlur={() => validateRegName(regName)}
                          placeholder="Nama Lengkap & Gelar (Guru)"
                          className={`w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border ${
                            regNameError
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                          } rounded-xl text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                      {regNameError && (
                        <p className="text-[10.5px] text-rose-600 font-semibold mt-1 pl-1">
                          {regNameError}
                        </p>
                      )}
                    </div>

                    {/* Field Email */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regEmailError) validateRegEmail(e.target.value);
                          }}
                          onBlur={() => validateRegEmail(regEmail)}
                          placeholder="contoh@gmail.com"
                          className={`w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border ${
                            regEmailError
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                          } rounded-xl text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                      {regEmailError && (
                        <p className="text-[10.5px] text-rose-600 font-semibold mt-1 pl-1">
                          {regEmailError}
                        </p>
                      )}
                    </div>

                    {/* Grid Password & Konfirmasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => {
                              setRegPassword(e.target.value);
                              if (regPasswordError) validateRegPassword(e.target.value);
                            }}
                            onBlur={() => validateRegPassword(regPassword)}
                            placeholder="Kata Sandi"
                            className={`w-full h-10.5 pl-10 pr-9 bg-slate-50 border ${
                              regPasswordError
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                            } rounded-xl text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {regPasswordError && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1 pl-1">
                            {regPasswordError}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showRegConfirmPassword ? 'text' : 'password'}
                            value={regConfirmPassword}
                            onChange={(e) => {
                              setRegConfirmPassword(e.target.value);
                              if (regConfirmError) validateRegConfirm(e.target.value, regPassword);
                            }}
                            onBlur={() => validateRegConfirm(regConfirmPassword, regPassword)}
                            placeholder="Ulangi Sandi"
                            className={`w-full h-10.5 pl-10 pr-9 bg-slate-50 border ${
                              regConfirmError
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                            } rounded-xl text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {regConfirmError && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1 pl-1">
                            {regConfirmError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 2: DATA SEKOLAH & KATEGORI JENJANG */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                        2. Sekolah & Kategori Jenjang
                      </div>
                      {(() => {
                        const detected = detectLevelFromName(regSchoolName);
                        return detected ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{SCHOOL_LEVELS[detected].title}</span>
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Field Nama Sekolah */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <School className="w-4 h-4 text-emerald-700" />
                        </div>
                        <input
                          type="text"
                          value={regSchoolName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRegSchoolName(val);
                            // Otomatis sinkronkan jenjang jika nama sekolah terindikasi
                            const detected = detectLevelFromName(val);
                            const nextLevel = detected || regSchoolLevel;
                            if (detected && detected !== regSchoolLevel) {
                              setRegSchoolLevel(detected);
                            }
                            if (regSchoolNameError) validateRegSchoolName(val, nextLevel);
                          }}
                          onBlur={() => validateRegSchoolName(regSchoolName, regSchoolLevel)}
                          placeholder="Contoh: SD Negeri 3, SMP Negeri 1, SMA..."
                          className={`w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border ${
                            regSchoolNameError
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/25'
                          } rounded-xl text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 shadow-xs focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                      {regSchoolNameError && (
                        <p className="text-[10.5px] text-rose-600 font-semibold mt-1 pl-1 leading-snug">
                          {regSchoolNameError}
                        </p>
                      )}
                    </div>

                    {/* Pilihan 3 Kategori Jenjang (SD, SMP, SMA) */}
                    <div>
                      {(() => {
                        const detected = detectLevelFromName(regSchoolName);
                        return (
                          <>
                            <div className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                              <span className="flex items-center space-x-1">
                                <span>Kategori Jenjang Sekolah</span>
                                {detected && <Lock className="w-2.5 h-2.5 text-amber-600 inline" />}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['SD', 'SMP', 'SMA'] as SchoolLevel[]).map((levelKey) => {
                                const isSelected = regSchoolLevel === levelKey;
                                const isLockedOther = Boolean(detected && detected !== levelKey);
                                const info = SCHOOL_LEVELS[levelKey];
                                return (
                                  <button
                                    key={levelKey}
                                    type="button"
                                    disabled={isLockedOther}
                                    onClick={() => {
                                      if (isLockedOther) return;
                                      setRegSchoolLevel(levelKey);
                                      if (regSchoolName.trim()) {
                                        validateRegSchoolName(regSchoolName, levelKey);
                                      }
                                    }}
                                    title={
                                      isLockedOther
                                        ? `Terkunci: nama sekolah sudah terdeteksi sebagai ${SCHOOL_LEVELS[detected!].title}`
                                        : info.title
                                    }
                                    className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                                      isLockedOther
                                        ? 'opacity-35 bg-slate-100 text-slate-400 border-dashed border-slate-300 cursor-not-allowed select-none'
                                        : isSelected
                                        ? 'bg-[#063826] text-white border-[#063826] shadow-2xs font-bold ring-1 ring-emerald-400/40 cursor-pointer'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs font-bold leading-tight">{info.title}</span>
                                      {isLockedOther && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                    </div>
                                    <span
                                      className={`text-[9px] mt-0.5 ${
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
                              <p className="text-[9.5px] text-amber-700 mt-1 flex items-center space-x-1">
                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                <span>Terkunci ke {detected}. Ubah/hapus kata {detected} di nama sekolah jika ingin mengganti.</span>
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* BAGIAN 3: PILIHAN SOLAT YANG DIABSEN */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      3. Solat yang Hendak Diabsen
                    </div>

                    {/* Chips Solat */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Subuh', 'Dhuha', 'Zuhur', 'Asar', 'Maghrib', 'Isya'].map((prayerName) => {
                        const isSelected = regPrayers.includes(prayerName);
                        return (
                          <button
                            key={prayerName}
                            type="button"
                            onClick={() => toggleRegPrayer(prayerName)}
                            className={`py-1.5 px-2 rounded-xl text-xs flex items-center justify-center space-x-1 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 font-semibold shadow-xs'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 font-normal'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>{prayerName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tombol Register */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isRegFormValid || isRegLoading}
                      className="w-full h-12 bg-gradient-to-r from-[#063826] via-[#0b533d] to-[#1e40af] hover:from-[#04281b] hover:to-[#172554] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[15px] sm:text-[16px] tracking-wide rounded-xl border border-emerald-950/40 shadow-lg shadow-emerald-950/25 transition-all flex items-center justify-center cursor-pointer ring-1 ring-white/15"
                    >
                      {isRegLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                          <span>Mendaftarkan & Mengatur Sekolah...</span>
                        </div>
                      ) : (
                        'Daftar Akun Baru'
                      )}
                    </button>
                  </div>
                </form>

                {/* Kembali ke Login */}
                <div className="pt-3 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveScreen('login')}
                      className="text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Bantuan "Lupa Password?" */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-800">
                Lupa Password Guru?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Silakan hubungi administrator sekolah atau gunakan kata sandi default awal: <strong className="text-slate-800">password123</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#063826] to-[#1e40af] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}
      {/* Modal Dialog: Apakah Anda ingin menginstal aplikasi? */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 text-center text-slate-800 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Tombol Silang (X) di Pojok Kanan Atas */}
            <button
              type="button"
              onClick={handleChooseContinueBrowser}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup dan lanjutkan di Chrome"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo SIAS dengan Lingkaran Hijau Modern */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#063826] via-[#094230] to-[#0d5940] shadow-md ring-4 ring-emerald-500/20 p-2 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/assets/logo-192.png"
                alt="Logo SIAS"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Pertanyaan & Subteks */}
            <h3 className="font-outfit font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
              Apakah Anda ingin menginstal aplikasi?
            </h3>
            <p className="font-jakarta text-xs sm:text-[13px] text-slate-500 mt-2 leading-relaxed max-w-[280px] mx-auto">
              Pasang aplikasi SIAS langsung di HP untuk akses lebih cepat seperti aplikasi Android, atau lanjutkan di browser Chrome.
            </p>

            {/* 2 Opsi Pilihan Sesuai Permintaan: Ya (Download) atau Tidak (Lanjut di Chrome) */}
            <div className="mt-6 space-y-2.5">
              {/* Opsi 1: Ya -> Langsung download / instal */}
              <button
                type="button"
                onClick={handleChooseInstall}
                className="w-full py-3 px-4 rounded-xl font-jakarta font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Ya, Download Aplikasi</span>
              </button>

              {/* Opsi 2: Tidak -> Lanjutkan di Chrome */}
              <button
                type="button"
                onClick={handleChooseContinueBrowser}
                className="w-full py-3 px-4 rounded-xl font-jakarta font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Tidak, Lanjutkan di Chrome</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Panduan Tambah ke Layar Utama Khusus Pengguna iOS */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/assets/logo-192.png" alt="Logo SIAS" className="w-8 h-8 rounded-lg" />
                <h3 className="font-outfit font-black text-base text-slate-900">
                  Pasang SIAS di iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowIOSInstallGuide(false);
                  setActiveScreen('login');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
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
            </div>

            <button
              onClick={() => {
                setShowIOSInstallGuide(false);
                setActiveScreen('login');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white cursor-pointer shadow-xs"
            >
              Lanjutkan ke Aplikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
