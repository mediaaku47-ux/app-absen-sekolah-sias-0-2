import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  User,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface ProfileProps {
  onNavigate: (path: string, params?: any) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, updateUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || 'Kamal',
    username: user?.username || 'kamal',
    email: user?.email || 'mediaaku47@gmail.com',
    roleTitle: user?.role === 'admin' ? 'Administrator Sistem SIAS' : 'Guru / Pembina Ibadah',
    assignedClasses: 'Kelas 10, Kelas 11, Kelas 12',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        username: user.username || prev.username,
        email: user.email || prev.email,
        roleTitle: user.role === 'admin' ? 'Administrator Sistem SIAS' : 'Guru / Pembina Ibadah',
      }));
    }
  }, [user]);

  // Otomatis hilangkan notifikasi setelah 6 detik
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newPassword) {
      setMessage({ type: 'error', text: 'Masukkan password baru' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.updateProfile({
        name: (user?.name || formData.name).trim(),
        email: (user?.email || formData.email).trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword,
      });

      if (res.user) {
        updateUser(res.user);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password akun berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengubah password akun' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f3] text-slate-800 pb-20 lg:pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#063826] via-[#094230] to-[#0f172a] text-white px-5 sm:px-8 pt-6 pb-12 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center space-x-1.5 text-emerald-200 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
            {/* Foto / Avatar */}
            <div>
              <img
                src="/assets/aistudio/ui_user_profile_avatar_person_icon_208734_53544997.png"
                alt="Foto Profil"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain brightness-0 invert drop-shadow-lg"
              />
            </div>

            {/* Info Singkat: Gmail di bawah ikon, bawahnya peran itu aja */}
            <div>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight break-all">
                {formData.email}
              </p>
              <p className="text-emerald-200/90 text-sm font-semibold mt-0.5">
                {formData.roleTitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Detail Profil */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 space-y-6">
        {/* Notifikasi feedback */}
        {message && (
          <div
            className={`p-4 rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Card 1: Profil Guru / Administrator (Dipindahkan dari Pengaturan) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-outfit font-extrabold text-base text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span>Profil Guru / Administrator</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-outfit block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={user?.name || formData.name}
                readOnly
                disabled
                tabIndex={-1}
                className="font-jakarta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                title="Nama akun guru"
              />
            </div>

            <div>
              <label className="font-outfit block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email || formData.email}
                readOnly
                disabled
                tabIndex={-1}
                className="font-jakarta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                title="Alamat email akun"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-outfit font-extrabold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2 tracking-tight">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Ubah Password Akun</span>
            </h4>
            <p className="font-jakarta text-xs text-slate-500 mb-4 font-medium">
              Kosongkan jika tidak ingin mengganti password
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
              <div>
                <label className="font-outfit block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-jakarta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-outfit block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-jakarta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-outfit block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-jakarta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {(currentPassword || newPassword || confirmPassword) && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdatingPassword ? 'Menyimpan Password...' : 'Simpan Password Baru'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Card 2: Ringkasan Tugas */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Ringkasan Tugas</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Kelas Binaan</span>
              <span className="text-xs font-bold text-slate-800">{formData.assignedClasses}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Tahun Ajaran Aktif</span>
              <span className="text-xs font-bold text-emerald-700">2026/2027 (Semester Ganjil)</span>
            </div>
          </div>
        </div>

        {/* Tombol Log Out di Paling Bawah Profil */}
        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-[0.98] transition-all font-jakarta font-bold text-sm cursor-pointer shadow-xs"
            title="Keluar dari akun SIAS"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Keluar / Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
