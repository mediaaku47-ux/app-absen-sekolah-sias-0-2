import { Router, Response } from 'express';
import { db, syncClassesForSchool, clearAllDataAndHistory, getUserSettings, setUserSetting, ensureUserClasses } from './db.ts';
import { AuthenticatedRequest, generateToken, hashPassword, requireAuth, optionalAuth, verifyPassword } from './auth.ts';
import { neonStorage } from './storage.ts';
import { validateSchoolCategory } from '../src/utils/schoolValidation.ts';

export const apiRouter = Router();

// ================= HEALTH & DB VERIFICATION =================
apiRouter.get('/health', async (_req, res) => {
  try {
    const dbInfo = (await db.queryOne('SELECT current_database(), current_user, version()')) as any;
    const userCount = (await db.queryOne('SELECT COUNT(*) as count FROM users')) as any;
    return res.json({
      status: 'ok',
      database: 'Neon PostgreSQL',
      connected: true,
      current_database: dbInfo?.current_database,
      current_user: dbInfo?.current_user,
      total_users: Number(userCount?.count || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      database: 'Neon PostgreSQL',
      connected: false,
      error: err.message,
    });
  }
});

// ================= AUTH ROUTES =================
apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/email dan password harus diisi' });
  }

  const trimmedUsername = String(username).trim();

  // Cari user di Neon PostgreSQL berdasarkan username atau email secara case-insensitive
  const user = await db.prepare(`
    SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
  `).get(trimmedUsername, trimmedUsername) as any;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  const authUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // Pastikan kelas default guru tersedia di database
  await ensureUserClasses(user.id);

  const token = generateToken(authUser);
  return res.json({ token, user: authUser });
});

apiRouter.post('/auth/register-teacher', async (req, res) => {
  const { name, email, password, school_name, school_level, prayers } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama lengkap, email, dan password harus diisi' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const username = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');

  // Validasi kesesuaian nama sekolah dan kategori jenjang (SD, SMP, atau SMA)
  const validation = validateSchoolCategory(school_name || '', school_level || '');
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  const verifiedLevel = validation.normalizedLevel;
  const verifiedSchoolName = (school_name || '').trim();

  // Cek apakah email atau username sudah dipakai
  const existing = await db.prepare(`
    SELECT id FROM users WHERE email = ? OR username = ?
  `).get(trimmedEmail, username) as any;

  if (existing) {
    return res.status(400).json({ error: 'Email atau akun ini sudah terdaftar. Silakan login.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  const hash = hashPassword(password);
  const result = await db.prepare(`
    INSERT INTO users (name, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'guru')
  `).run(trimmedName, username, trimmedEmail, hash);

  const newUserId = Number(result.lastInsertRowid);
  const authUser = {
    id: newUserId,
    name: trimmedName,
    username,
    email: trimmedEmail,
    role: 'guru',
  };

  // Simpan pengaturan sekolah & jenjang khusus user ini (Terisolasi per akun guru)
  // Hanya 3 data yang disimpan agar SQL user_settings rapi: school_name, school_level, solat_pilihan
  await setUserSetting(newUserId, 'school_name', verifiedSchoolName);
  await setUserSetting(newUserId, 'school_level', verifiedLevel);
  const prayerList = Array.isArray(prayers) && prayers.length > 0 ? prayers : ['Zuhur', 'Asar'];
  await setUserSetting(newUserId, 'solat_pilihan', JSON.stringify(prayerList));

  // Bersihkan data lain agar SQL user_settings rapi
  await db.prepare(`
    DELETE FROM user_settings 
    WHERE user_id = ? AND key NOT IN ('school_name', 'school_level', 'solat_pilihan')
  `).run(newUserId);

  // Sinkronkan kelas baru terisolasi untuk user ini (Murid dimulai dari 0 / kosong)
  await syncClassesForSchool(newUserId, verifiedSchoolName, verifiedLevel);

  const token = generateToken(authUser);
  return res.status(201).json({ token, user: authUser });
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

apiRouter.put('/auth/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }
    const newHash = hashPassword(newPassword);
    await db.prepare(`
      UPDATE users SET name = ?, email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name || user.name, email || user.email, newHash, userId);
  } else {
    await db.prepare(`
      UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name || user.name, email || user.email, userId);
  }

  const updatedUser = await db.prepare('SELECT id, name, username, email, role FROM users WHERE id = ?').get(userId);
  return res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
});

apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { school_name, school_level, username, password, prayers, system_title } = req.body;
    const penilaiName = 'Penilai';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    // Validasi kesesuaian nama sekolah dan kategori jenjang (SD, SMP, atau SMA)
    const validation = validateSchoolCategory(school_name || '', school_level || '');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const verifiedLevel = validation.normalizedLevel;
    const verifiedSchoolName = (school_name || '').trim();

    if (!prayers || !Array.isArray(prayers) || prayers.length === 0) {
      return res.status(400).json({ error: 'Pilih minimal satu waktu solat yang ingin diabsen' });
    }

    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    let userId: number;
    if (existing) {
      const hash = hashPassword(password);
      await db.prepare(`
        UPDATE users SET name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(penilaiName, hash, (existing as any).id);
      userId = (existing as any).id;
    } else {
      const hash = hashPassword(password);
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@sekolah.sch.id`;
      const result = await db.prepare(`
        INSERT INTO users (name, username, email, password_hash, role)
        VALUES (?, ?, ?, ?, 'admin')
      `).run(penilaiName, username, email, hash);
      userId = Number(result.lastInsertRowid);
    }

    await setUserSetting(userId, 'school_name', verifiedSchoolName);
    await setUserSetting(userId, 'school_level', verifiedLevel);
    await setUserSetting(userId, 'solat_pilihan', JSON.stringify(prayers));

    await db.prepare(`
      DELETE FROM user_settings 
      WHERE user_id = ? AND key NOT IN ('school_name', 'school_level', 'solat_pilihan')
    `).run(userId);

    await syncClassesForSchool(userId, verifiedSchoolName, verifiedLevel);

    const authUser = {
      id: userId,
      name: penilaiName,
      username,
      email: `${username}@sekolah.sch.id`,
      role: 'admin',
    };

    const token = generateToken(authUser);
    return res.status(201).json({
      message: 'Registrasi guru dan konfigurasi sistem absensi solat berhasil',
      token,
      user: authUser,
      school_name: verifiedSchoolName,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal melakukan registrasi' });
  }
});

// Settings Get (Terisolasi per user jika login, atau fallback ke user guru pertama)
apiRouter.get('/settings/app', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    let userId = req.user?.id;
    if (!userId) {
      const firstUser = (await db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get()) as any;
      userId = firstUser?.id;
    }
    if (userId) {
      const settings = await getUserSettings(userId);
      return res.json(settings);
    }
    return res.json({
      school_name: '',
      school_level: 'SMA',
      solat_pilihan: JSON.stringify(['Zuhur', 'Asar']),
      prayers: JSON.stringify(['Zuhur', 'Asar']),
      permanent_prayers: JSON.stringify(['Zuhur', 'Asar']),
      system_title: 'Sistem Informasi Absensi Solat',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/settings/setup', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { school_name, school_level, prayers } = req.body;

    const current = await getUserSettings(userId);
    const effectiveName = school_name !== undefined ? (school_name || '').trim() : (current.school_name || '').trim();
    const effectiveLevel = school_level !== undefined ? (school_level || '').trim() : (current.school_level || '').trim();

    const validation = validateSchoolCategory(effectiveName, effectiveLevel);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const verifiedLevel = validation.normalizedLevel;

    // Pastikan daftar nama solat yang dipilih
    let chosenPrayers: string[] = [];
    if (Array.isArray(prayers) && prayers.length > 0) {
      chosenPrayers = prayers;
    } else if (current.solat_pilihan) {
      try {
        chosenPrayers = JSON.parse(current.solat_pilihan);
      } catch (e) {
        chosenPrayers = ['Zuhur', 'Asar'];
      }
    } else {
      chosenPrayers = ['Zuhur', 'Asar'];
    }

    // 1. Simpan hanya 3 data di SQL user_settings: school_name, school_level, solat_pilihan
    await setUserSetting(userId, 'school_name', effectiveName);
    await setUserSetting(userId, 'school_level', verifiedLevel);
    await setUserSetting(userId, 'solat_pilihan', JSON.stringify(chosenPrayers));

    // 2. Bersihkan dan hapus setting lain selain 3 data di atas agar SQL user_settings rapi
    await db.prepare(`
      DELETE FROM user_settings 
      WHERE user_id = ? AND key NOT IN ('school_name', 'school_level', 'solat_pilihan')
    `).run(userId);

    // 3. Sinkronkan kelas untuk jenjang sekolah
    await syncClassesForSchool(userId, effectiveName, verifiedLevel);

    return res.json({
      message: 'Pengaturan sekolah dan solat berhasil disimpan',
      school_name: effectiveName,
      school_level: verifiedLevel,
      solat_pilihan: chosenPrayers,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/system/clear-all-data', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await clearAllDataAndHistory(userId);
    return res.json({ success: true, message: 'Seluruh data murid, kelas, dan riwayat absensi Anda berhasil dikosongkan.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= DASHBOARD STATS (Strictly user-scoped) =================
apiRouter.get('/dashboard/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await ensureUserClasses(userId);

    const today = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const classIdParam = req.query.class_id ? parseInt(req.query.class_id as string, 10) : null;
    const classId = classIdParam && !isNaN(classIdParam) ? classIdParam : null;

    // Total active students belonging to this user
    const totalStudents = classId
      ? (await db.prepare('SELECT COUNT(*) as count FROM students WHERE user_id = ? AND is_active = 1 AND class_id = ?').get(userId, classId) as any).count
      : (await db.prepare('SELECT COUNT(*) as count FROM students WHERE user_id = ? AND is_active = 1').get(userId) as any).count;

    // Total classes belonging to this user
    const totalClasses = (await db.prepare('SELECT COUNT(*) as count FROM classes WHERE user_id = ?').get(userId) as any).count;

    // User's active prayers filter
    const userSettings = await getUserSettings(userId);
    let activePrayerFilter = '';
    let activePrayerIds: number[] = [];
    if (userSettings.permanent_prayers) {
      try {
        const permList = JSON.parse(userSettings.permanent_prayers) as string[];
        const allPrayers = await db.prepare('SELECT id, name FROM prayer_types').all() as any[];
        const permLower = permList.map((p: string) => p.trim().toLowerCase());
        activePrayerIds = allPrayers.filter(p => permLower.includes(p.name.toLowerCase())).map(p => p.id);
      } catch (e) {
        // ignore
      }
    }
    if (activePrayerIds.length === 0) {
      const allPrayers = await db.prepare('SELECT id FROM prayer_types WHERE is_active = 1').all() as any[];
      activePrayerIds = allPrayers.map(p => p.id);
    }
    activePrayerFilter = `AND a.prayer_type_id IN (${activePrayerIds.join(',') || '0'})`;

    // Today's attendance counts for this user
    const todayStats = classId
      ? (await db.prepare(`
          SELECT 
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND a.attendance_date = ? AND s.class_id = ? ${activePrayerFilter}
        `).get(userId, today, classId) as any)
      : (await db.prepare(`
          SELECT 
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance a
          WHERE a.user_id = ? AND a.attendance_date = ? ${activePrayerFilter}
        `).get(userId, today) as any);

    const todayTotal = todayStats?.total || 0;
    const todayHadir = todayStats?.hadir || 0;
    const persentase = todayTotal > 0 ? Math.round((todayHadir / todayTotal) * 100) : 0;

    // 7 days trend for this user
    const last7Days = classId
      ? await db.prepare(`
          SELECT 
            a.attendance_date,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND a.attendance_date >= date(?, '-6 days') AND a.attendance_date <= ? AND s.class_id = ?
          GROUP BY a.attendance_date
          ORDER BY a.attendance_date ASC
        `).all(userId, today, today, classId)
      : await db.prepare(`
          SELECT 
            attendance_date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance
          WHERE user_id = ? AND attendance_date >= date(?, '-6 days') AND attendance_date <= ?
          GROUP BY attendance_date
          ORDER BY attendance_date ASC
        `).all(userId, today, today);

    // ================= KALKULASI MINGGUAN =================
    const targetDateObj = new Date(today + 'T12:00:00');
    const dayOfWeek = targetDateObj.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayObj = new Date(targetDateObj);
    mondayObj.setDate(targetDateObj.getDate() + diffToMonday);
    const sundayObj = new Date(mondayObj);
    sundayObj.setDate(mondayObj.getDate() + 6);

    const weekStartDate = mondayObj.toISOString().split('T')[0];
    const weekEndDate = sundayObj.toISOString().split('T')[0];

    const weeklyStatsRaw = classId
      ? (await db.prepare(`
          SELECT 
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND a.attendance_date >= ? AND a.attendance_date <= ? AND s.class_id = ?
        `).get(userId, weekStartDate, weekEndDate, classId) as any)
      : (await db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance
          WHERE user_id = ? AND attendance_date >= ? AND attendance_date <= ?
        `).get(userId, weekStartDate, weekEndDate) as any);

    const weeklyTotal = weeklyStatsRaw?.total || 0;
    const weeklyHadir = weeklyStatsRaw?.hadir || 0;
    const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyHadir / weeklyTotal) * 100) : 0;

    const prayerFilterPlaceholder = activePrayerIds.length > 0 ? `WHERE p.id IN (${activePrayerIds.join(',')})` : 'WHERE p.is_active = 1';
    const weeklyPrayersRaw = classId
      ? (await db.prepare(`
          SELECT 
            p.id,
            p.name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id 
            AND a.attendance_date >= ? AND a.attendance_date <= ?
            AND a.user_id = ?
            AND a.student_id IN (SELECT id FROM students WHERE class_id = ? AND user_id = ? AND is_active = 1)
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(weekStartDate, weekEndDate, userId, classId, userId) as any[])
      : (await db.prepare(`
          SELECT 
            p.id,
            p.name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id 
            AND a.attendance_date >= ? AND a.attendance_date <= ?
            AND a.user_id = ?
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(weekStartDate, weekEndDate, userId) as any[]);

    const weeklyPrayerBreakdown = weeklyPrayersRaw.map(p => ({
      id: p.id,
      name: p.name,
      total: p.total || 0,
      hadir: p.hadir || 0,
      percentage: (p.total || 0) > 0 ? Math.round(((p.hadir || 0) / p.total) * 100) : 0,
    }));

    // ================= KALKULASI BULANAN =================
    const [curYear, curMonth] = today.split('-');
    const monthStartDate = `${curYear}-${curMonth}-01`;
    const lastDayOfMonth = new Date(parseInt(curYear, 10), parseInt(curMonth, 10), 0).getDate();
    const monthEndDate = `${curYear}-${curMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const monthlyStatsRaw = classId
      ? (await db.prepare(`
          SELECT 
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND a.attendance_date >= ? AND a.attendance_date <= ? AND s.class_id = ?
        `).get(userId, monthStartDate, monthEndDate, classId) as any)
      : (await db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM attendance
          WHERE user_id = ? AND attendance_date >= ? AND attendance_date <= ?
        `).get(userId, monthStartDate, monthEndDate) as any);

    const monthlyTotal = monthlyStatsRaw?.total || 0;
    const monthlyHadir = monthlyStatsRaw?.hadir || 0;
    const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyHadir / monthlyTotal) * 100) : 0;

    const monthlyPrayersRaw = classId
      ? (await db.prepare(`
          SELECT 
            p.id,
            p.name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id 
            AND a.attendance_date >= ? AND a.attendance_date <= ?
            AND a.user_id = ?
            AND a.student_id IN (SELECT id FROM students WHERE class_id = ? AND user_id = ? AND is_active = 1)
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(monthStartDate, monthEndDate, userId, classId, userId) as any[])
      : (await db.prepare(`
          SELECT 
            p.id,
            p.name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id 
            AND a.attendance_date >= ? AND a.attendance_date <= ?
            AND a.user_id = ?
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(monthStartDate, monthEndDate, userId) as any[]);

    const monthlyPrayerBreakdown = monthlyPrayersRaw.map(p => ({
      id: p.id,
      name: p.name,
      total: p.total || 0,
      hadir: p.hadir || 0,
      percentage: (p.total || 0) > 0 ? Math.round(((p.hadir || 0) / p.total) * 100) : 0,
    }));

    // Attendance by Class (overall this month for this user)
    const classStats = await db.prepare(`
      SELECT 
        c.id,
        c.name as class_name,
        c.grade,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM classes c
      JOIN students s ON s.class_id = c.id AND s.user_id = ?
      LEFT JOIN attendance a ON a.student_id = s.id AND a.user_id = ?
      WHERE c.user_id = ? AND s.is_active = 1
      GROUP BY c.id, c.name, c.grade
      ORDER BY c.name ASC
    `).all(userId, userId, userId) as any[];

    const classStatsWithPercentage = classStats.map(c => {
      const total = c.total || 0;
      const hadir = c.hadir || 0;
      return {
        ...c,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0
      };
    });

    // Statistics per prayer type for this user
    const prayerStats = await db.prepare(`
      SELECT 
        p.id,
        p.name as prayer_name,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM prayer_types p
      LEFT JOIN attendance a ON a.prayer_type_id = p.id AND a.user_id = ?
      ${prayerFilterPlaceholder}
      GROUP BY p.id, p.name
      ORDER BY p.sort_order ASC
    `).all(userId) as any[];

    const prayerStatsWithPercentage = prayerStats.map(p => {
      const total = p.total || 0;
      const hadir = p.hadir || 0;
      return {
        ...p,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0
      };
    });

    // Statistics per prayer type khusus hari yang dipilih
    const todayPrayerStatsRaw = classId
      ? await db.prepare(`
          SELECT 
            p.id,
            p.name as prayer_name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id 
            AND a.attendance_date = ? 
            AND a.user_id = ?
            AND a.student_id IN (SELECT id FROM students WHERE class_id = ? AND user_id = ? AND is_active = 1)
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(today, userId, classId, userId) as any[]
      : await db.prepare(`
          SELECT 
            p.id,
            p.name as prayer_name,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
          FROM prayer_types p
          LEFT JOIN attendance a ON a.prayer_type_id = p.id AND a.attendance_date = ? AND a.user_id = ?
          ${prayerFilterPlaceholder}
          GROUP BY p.id, p.name
          ORDER BY p.sort_order ASC
        `).all(today, userId) as any[];

    const todayPrayerStats = todayPrayerStatsRaw.map(p => {
      const total = p.total || 0;
      const hadir = p.hadir || 0;
      return {
        ...p,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0
      };
    });

    // Today's checklist status per Class and Prayer
    const activePrayers = await db.prepare(`SELECT p.id, p.name FROM prayer_types p ${prayerFilterPlaceholder} ORDER BY p.sort_order ASC`).all() as any[];
    const classes = await db.prepare('SELECT id, name FROM classes WHERE user_id = ? ORDER BY name ASC').all(userId) as any[];

    const todayChecklist: any[] = [];
    for (const c of classes) {
      const studentCount = (await db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ? AND user_id = ? AND is_active = 1').get(c.id, userId) as any).count;
      for (const p of activePrayers) {
        const attendanceCount = (await db.prepare(`
          SELECT COUNT(a.id) as count
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE s.class_id = ? AND a.prayer_type_id = ? AND a.attendance_date = ? AND a.user_id = ? AND s.user_id = ?
        `).get(c.id, p.id, today, userId, userId) as any).count;

        todayChecklist.push({
          class_id: c.id,
          class_name: c.name,
          prayer_type_id: p.id,
          prayer_name: p.name,
          student_count: studentCount,
          recorded_count: attendanceCount,
          is_completed: studentCount > 0 && attendanceCount >= studentCount
        });
      }
    }

    // Students with lowest attendance rate for this user
    const lowAttendanceStudents = classId
      ? await db.prepare(`
          SELECT 
            s.id,
            s.name,
            c.name as class_name,
            COUNT(a.id) as total_attendance,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur,
            ROUND(CAST((CAST(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) AS numeric) / COUNT(a.id)) * 100 AS numeric), 1) as percentage
          FROM students s
          JOIN classes c ON s.class_id = c.id
          JOIN attendance a ON a.student_id = s.id
          WHERE s.is_active = 1 AND s.class_id = ? AND s.user_id = ? AND a.user_id = ? ${activePrayerFilter}
          GROUP BY s.id, s.name, c.name
          HAVING COUNT(a.id) >= 1 AND SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) < COUNT(a.id)
          ORDER BY tidak_hadir DESC, percentage ASC, (SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) + SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END)) DESC
          LIMIT 8
        `).all(classId, userId, userId)
      : await db.prepare(`
          SELECT 
            s.id,
            s.name,
            c.name as class_name,
            COUNT(a.id) as total_attendance,
            SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
            SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
            SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
            SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur,
            ROUND(CAST((CAST(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) AS numeric) / COUNT(a.id)) * 100 AS numeric), 1) as percentage
          FROM students s
          JOIN classes c ON s.class_id = c.id
          JOIN attendance a ON a.student_id = s.id
          WHERE s.is_active = 1 AND s.user_id = ? AND a.user_id = ? ${activePrayerFilter}
          GROUP BY s.id, s.name, c.name
          HAVING COUNT(a.id) >= 1 AND SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) < COUNT(a.id)
          ORDER BY tidak_hadir DESC, percentage ASC, (SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) + SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END)) DESC
          LIMIT 8
        `).all(userId, userId);

    return res.json({
      school_name: userSettings.school_name || '',
      system_title: userSettings.system_title || 'Sistem Informasi Absensi Solat',
      totalStudents,
      totalClasses,
      today: {
        date: today,
        total: todayTotal,
        hadir: todayHadir,
        tidakHadir: todayStats?.tidak_hadir || 0,
        izin: todayStats?.izin || 0,
        sakit: todayStats?.sakit || 0,
        uzur: todayStats?.uzur || 0,
        percentage: persentase,
      },
      daily: {
        periodType: 'daily',
        title: 'Harian',
        subtitle: 'Hari Ini',
        dateRangeText: new Date(today + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        startDate: today,
        endDate: today,
        total: todayTotal,
        hadir: todayHadir,
        tidakHadir: todayStats?.tidak_hadir || 0,
        izin: todayStats?.izin || 0,
        sakit: todayStats?.sakit || 0,
        uzur: todayStats?.uzur || 0,
        percentage: persentase,
        hasData: todayTotal > 0,
        prayerBreakdown: todayPrayerStats.map(p => ({
          id: p.id,
          name: p.prayer_name,
          total: p.total,
          hadir: p.hadir,
          percentage: p.percentage,
        })),
      },
      weekly: {
        periodType: 'weekly',
        title: 'Mingguan',
        subtitle: 'Minggu Berjalan',
        dateRangeText: `${new Date(weekStartDate + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(weekEndDate + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        startDate: weekStartDate,
        endDate: weekEndDate,
        total: weeklyTotal,
        hadir: weeklyHadir,
        tidakHadir: weeklyStatsRaw?.tidak_hadir || 0,
        izin: weeklyStatsRaw?.izin || 0,
        sakit: weeklyStatsRaw?.sakit || 0,
        uzur: weeklyStatsRaw?.uzur || 0,
        percentage: weeklyPercentage,
        hasData: weeklyTotal > 0,
        prayerBreakdown: weeklyPrayerBreakdown,
      },
      monthly: {
        periodType: 'monthly',
        title: 'Bulanan',
        subtitle: 'Bulan Berjalan',
        dateRangeText: new Date(today + 'T12:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        startDate: monthStartDate,
        endDate: monthEndDate,
        total: monthlyTotal,
        hadir: monthlyHadir,
        tidakHadir: monthlyStatsRaw?.tidak_hadir || 0,
        izin: monthlyStatsRaw?.izin || 0,
        sakit: monthlyStatsRaw?.sakit || 0,
        uzur: monthlyStatsRaw?.uzur || 0,
        percentage: monthlyPercentage,
        hasData: monthlyTotal > 0,
        prayerBreakdown: monthlyPrayerBreakdown,
      },
      classStats: classStatsWithPercentage,
      prayerStats: prayerStatsWithPercentage,
      todayPrayerStats,
      todayChecklist,
      lowAttendanceStudents,
      trend: last7Days.map((d: any) => ({
        date: d.attendance_date,
        day: new Date(d.attendance_date + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'short' }),
        total: d.total || 0,
        hadir: d.hadir || 0,
        tidakHadir: d.tidak_hadir || 0,
        izin: d.izin || 0,
        sakit: d.sakit || 0,
        uzur: d.uzur || 0,
        percentage: d.total > 0 ? Math.round((d.hadir / d.total) * 100) : 0
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= STUDENTS CRUD (User-scoped) =================
apiRouter.get('/students', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { class_id, is_active, search } = req.query;

    let query = `
      SELECT s.*, c.name as class_name, c.grade
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (class_id && String(class_id) !== 'all' && String(class_id) !== '0') {
      query += ` AND s.class_id = ?`;
      params.push(Number(class_id));
    }
    if (is_active !== undefined && is_active !== '') {
      query += ` AND s.is_active = ?`;
      params.push(Number(is_active));
    }
    if (search) {
      query += ` AND s.name ILIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY c.name ASC, s.name ASC`;
    const students = await db.prepare(query).all(...params);
    return res.json(students);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/students/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const student = await db.prepare(`
      SELECT s.*, c.name as class_name, c.grade, ay.name as academic_year_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE s.id = ? AND s.user_id = ?
    `).get(req.params.id, userId) as any;

    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    // Get attendance summary for this student
    const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM attendance
      WHERE student_id = ? AND user_id = ?
    `).get(student.id, userId) as any;

    const total = summary?.total || 0;
    const hadir = summary?.hadir || 0;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

    // Get recent attendance logs
    const history = await db.prepare(`
      SELECT a.*, p.name as prayer_name
      FROM attendance a
      JOIN prayer_types p ON a.prayer_type_id = p.id
      WHERE a.student_id = ? AND a.user_id = ?
      ORDER BY a.attendance_date DESC, p.sort_order DESC
      LIMIT 100
    `).all(student.id, userId);

    return res.json({
      student,
      summary: {
        total,
        hadir,
        tidakHadir: summary?.tidak_hadir || 0,
        izin: summary?.izin || 0,
        sakit: summary?.sakit || 0,
        uzur: summary?.uzur || 0,
        percentage
      },
      history
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/students', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, gender, class_id } = req.body;
    if (!name || !gender || !class_id) {
      return res.status(400).json({ error: 'Nama, jenis kelamin, dan kelas wajib diisi' });
    }

    // Verify class belongs to this user
    const classExists = await db.prepare('SELECT id FROM classes WHERE id = ? AND user_id = ?').get(class_id, userId);
    if (!classExists) {
      return res.status(400).json({ error: 'Kelas yang dipilih tidak valid untuk akun Anda' });
    }

    const result = await db.prepare(`
      INSERT INTO students (user_id, name, gender, class_id, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(userId, name.trim(), gender, class_id);

    const newStudent = await db.prepare('SELECT * FROM students WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, userId);
    return res.status(201).json(newStudent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/students/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, gender, class_id, is_active } = req.body;
    const id = req.params.id;

    const student = await db.prepare('SELECT id FROM students WHERE id = ? AND user_id = ?').get(id, userId);
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    if (class_id) {
      const classExists = await db.prepare('SELECT id FROM classes WHERE id = ? AND user_id = ?').get(class_id, userId);
      if (!classExists) {
        return res.status(400).json({ error: 'Kelas tidak valid' });
      }
    }

    await db.prepare(`
      UPDATE students 
      SET name = COALESCE(?, name),
          gender = COALESCE(?, gender),
          class_id = COALESCE(?, class_id),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(name, gender, class_id, is_active !== undefined ? Number(is_active) : null, id, userId);

    const updated = await db.prepare('SELECT * FROM students WHERE id = ? AND user_id = ?').get(id, userId);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/students/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id;
    await db.prepare('DELETE FROM students WHERE id = ? AND user_id = ?').run(id, userId);
    return res.json({ message: 'Siswa berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= CLASSES CRUD (User-scoped) =================
apiRouter.get('/classes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await ensureUserClasses(userId);

    const classes = await db.prepare(`
      SELECT 
        c.*,
        ay.name as academic_year_name,
        ay.semester,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1 AND s.user_id = ?
      WHERE c.user_id = ?
      GROUP BY c.id, ay.name, ay.semester
      ORDER BY c.grade ASC, c.name ASC
    `).all(userId, userId);
    return res.json(classes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/classes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, grade, academic_year_id } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ error: 'Nama kelas dan tingkat wajib diisi' });
    }

    const result = await db.prepare(`
      INSERT INTO classes (user_id, name, grade, academic_year_id)
      VALUES (?, ?, ?, ?)
    `).run(userId, name, grade, academic_year_id || null);

    const created = await db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, userId);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/classes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, grade, academic_year_id } = req.body;
    const id = req.params.id;

    await db.prepare(`
      UPDATE classes 
      SET name = COALESCE(?, name),
          grade = COALESCE(?, grade),
          academic_year_id = COALESCE(?, academic_year_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(name, grade, academic_year_id, id, userId);

    const updated = await db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(id, userId);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/classes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id;
    const studentCount = (await db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ? AND user_id = ?').get(id, userId) as any).count;
    if (studentCount > 0) {
      return res.status(400).json({ error: `Kelas ini memiliki ${studentCount} siswa. Hapus atau pindahkan siswa terlebih dahulu.` });
    }
    await db.prepare('DELETE FROM classes WHERE id = ? AND user_id = ?').run(id, userId);
    return res.json({ message: 'Kelas berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= PRAYER TYPES CRUD =================
apiRouter.get('/prayer-types', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prayers = await db.prepare('SELECT * FROM prayer_types ORDER BY sort_order ASC, id ASC').all() as any[];
    let permSettingValue: string | null = null;
    let userId = req.user?.id;
    if (!userId) {
      const firstUser = (await db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get()) as any;
      userId = firstUser?.id;
    }
    if (userId) {
      const uSettings = await getUserSettings(userId);
      permSettingValue = uSettings.solat_pilihan || uSettings.permanent_prayers || null;
    }

    if (permSettingValue) {
      try {
        const permList = JSON.parse(permSettingValue) as string[];
        const permLower = permList.map((p: string) => p.trim().toLowerCase());
        for (const pr of prayers) {
          pr.is_active = permLower.includes(pr.name.toLowerCase()) ? 1 : 0;
        }
      } catch (e) {
        // ignore
      }
    }
    return res.json(prayers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/prayer-types', requireAuth, async (req, res) => {
  try {
    const { name, is_active, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama jenis solat wajib diisi' });
    }

    const existing = await db.prepare('SELECT id FROM prayer_types WHERE LOWER(name) = LOWER(?)').get(name);
    if (existing) {
      return res.status(400).json({ error: `Jenis solat "${name}" sudah ada` });
    }

    const result = await db.prepare(`
      INSERT INTO prayer_types (name, is_active, sort_order)
      VALUES (?, ?, ?)
    `).run(name, is_active !== undefined ? (is_active ? 1 : 0) : 1, sort_order || 0);

    const created = await db.prepare('SELECT * FROM prayer_types WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/prayer-types/:id', requireAuth, async (req, res) => {
  try {
    const { name, is_active, sort_order } = req.body;
    const id = req.params.id;

    if (name) {
      const existing = await db.prepare('SELECT id FROM prayer_types WHERE LOWER(name) = LOWER(?) AND id != ?').get(name, id);
      if (existing) {
        return res.status(400).json({ error: `Jenis solat "${name}" sudah digunakan` });
      }
    }

    await db.prepare(`
      UPDATE prayer_types 
      SET name = COALESCE(?, name),
          is_active = COALESCE(?, is_active),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, is_active !== undefined ? (is_active ? 1 : 0) : null, sort_order, id);

    const updated = await db.prepare('SELECT * FROM prayer_types WHERE id = ?').get(id);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/prayer-types/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const count = (await db.prepare('SELECT COUNT(*) as count FROM attendance WHERE prayer_type_id = ?').get(id) as any).count;
    if (count > 0) {
      return res.status(400).json({ error: `Jenis solat memiliki ${count} riwayat data absensi. Lebih baik nonaktifkan daripada menghapus.` });
    }
    await db.prepare('DELETE FROM prayer_types WHERE id = ?').run(id);
    return res.json({ message: 'Jenis solat berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= ACADEMIC YEARS CRUD (User-scoped) =================
apiRouter.get('/academic-years', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    let years = await db.prepare('SELECT * FROM academic_years WHERE user_id = ? ORDER BY id DESC').all(userId);
    if (!years || years.length === 0) {
      await db.prepare(`
        INSERT INTO academic_years (user_id, name, semester, is_active)
        VALUES (?, '2025/2026', 'Genap', 1)
      `).run(userId);
      years = await db.prepare('SELECT * FROM academic_years WHERE user_id = ? ORDER BY id DESC').all(userId);
    }
    return res.json(years);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/academic-years', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, semester, is_active } = req.body;
    if (!name || !semester) {
      return res.status(400).json({ error: 'Nama tahun ajaran dan semester wajib diisi' });
    }

    if (is_active) {
      await db.prepare('UPDATE academic_years SET is_active = 0 WHERE user_id = ?').run(userId);
    }

    const result = await db.prepare(`
      INSERT INTO academic_years (user_id, name, semester, is_active)
      VALUES (?, ?, ?, ?)
    `).run(userId, name, semester, is_active ? 1 : 0);

    const created = await db.prepare('SELECT * FROM academic_years WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, userId);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/academic-years/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, semester, is_active } = req.body;
    const id = req.params.id;

    if (is_active) {
      await db.prepare('UPDATE academic_years SET is_active = 0 WHERE user_id = ?').run(userId);
    }

    await db.prepare(`
      UPDATE academic_years
      SET name = COALESCE(?, name),
          semester = COALESCE(?, semester),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(name, semester, is_active !== undefined ? (is_active ? 1 : 0) : null, id, userId);

    const updated = await db.prepare('SELECT * FROM academic_years WHERE id = ? AND user_id = ?').get(id, userId);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/academic-years/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id;
    await db.prepare('DELETE FROM academic_years WHERE id = ? AND user_id = ?').run(id, userId);
    return res.json({ message: 'Tahun ajaran berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= ATTENDANCE MODULE (User-scoped) =================
// Get attendance sheet for a specific date, class, prayer type
apiRouter.get('/attendance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, class_id, prayer_type_id } = req.query;
    if (!date || !class_id || !prayer_type_id) {
      return res.status(400).json({ error: 'Parameter date, class_id, dan prayer_type_id diperlukan' });
    }

    const prayerInfo = await db.prepare('SELECT * FROM prayer_types WHERE id = ?').get(Number(prayer_type_id));
    if (!prayerInfo) {
      return res.status(404).json({ error: 'Jenis solat tidak ditemukan' });
    }

    const isAll = String(class_id) === 'all' || String(class_id) === '0';
    let classInfo: any;
    let students: any[];

    if (isAll) {
      classInfo = { id: 'all', name: 'Semua Kelas', grade: 'Semua' };
      students = await db.prepare(`
        SELECT 
          s.id as student_id,
          s.name,
          s.gender,
          c.name as class_name,
          a.id as attendance_id,
          a.status,
          a.notes,
          a.updated_at as recorded_at
        FROM students s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN attendance a ON a.student_id = s.id 
          AND a.prayer_type_id = ? 
          AND a.attendance_date = ?
          AND a.user_id = ?
        WHERE s.user_id = ? AND c.user_id = ? AND s.is_active = 1
        ORDER BY c.name ASC, s.name ASC
      `).all(Number(prayer_type_id), String(date), userId, userId, userId);
    } else {
      classInfo = await db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(Number(class_id), userId);
      if (!classInfo) {
        return res.status(404).json({ error: 'Kelas tidak ditemukan' });
      }
      students = await db.prepare(`
        SELECT 
          s.id as student_id,
          s.name,
          s.gender,
          c.name as class_name,
          a.id as attendance_id,
          a.status,
          a.notes,
          a.updated_at as recorded_at
        FROM students s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN attendance a ON a.student_id = s.id 
          AND a.prayer_type_id = ? 
          AND a.attendance_date = ?
          AND a.user_id = ?
        WHERE s.class_id = ? AND s.user_id = ? AND s.is_active = 1
        ORDER BY s.name ASC
      `).all(Number(prayer_type_id), String(date), userId, Number(class_id), userId);
    }

    const isAlreadyRecorded = students.some((s: any) => s.attendance_id !== null);

    return res.json({
      class: classInfo,
      prayer: prayerInfo,
      date,
      isAlreadyRecorded,
      students: students.map((s: any) => ({
        student_id: s.student_id,
        name: s.name,
        gender: s.gender,
        class_name: s.class_name,
        attendance_id: s.attendance_id,
        status: s.status || null,
        notes: s.notes || '',
        recorded_at: s.recorded_at
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Batch Save or Update Attendance (Strictly user-scoped)
apiRouter.post('/attendance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { date, class_id, prayer_type_id, items, mode } = req.body;
    if (!date || !class_id || !prayer_type_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data absensi tidak lengkap' });
    }

    const userId = req.user!.id;
    const isAll = String(class_id) === 'all' || String(class_id) === '0';

    // Verify students belong to this user
    const studentIds = items.map((i: any) => Number(i.student_id)).filter((id: number) => !isNaN(id));
    if (studentIds.length > 0) {
      const verifiedStudents = await db.prepare(`
        SELECT COUNT(id) as count FROM students WHERE user_id = ? AND id IN (${studentIds.join(',')})
      `).get(userId) as any;
      if (Number(verifiedStudents?.count || 0) !== studentIds.length) {
        return res.status(403).json({ error: 'Ada murid yang tidak terdaftar di akun Anda' });
      }
    }

    // Check duplicate existence for this user
    const existingCount = isAll
      ? (await db.prepare(`
          SELECT COUNT(a.id) as count
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND a.prayer_type_id = ? AND a.attendance_date = ?
        `).get(userId, prayer_type_id, date) as any).count
      : (await db.prepare(`
          SELECT COUNT(a.id) as count
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.user_id = ? AND s.class_id = ? AND a.prayer_type_id = ? AND a.attendance_date = ?
        `).get(userId, class_id, prayer_type_id, date) as any).count;

    if (existingCount > 0 && mode === 'prevent_duplicate') {
      return res.status(409).json({ 
        error: 'Absensi siswa untuk solat ini sudah tersedia.',
        canUpdate: true 
      });
    }

    const upsertStmt = await db.prepare(`
      INSERT INTO attendance (user_id, student_id, prayer_type_id, attendance_date, status, notes, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, prayer_type_id, attendance_date) DO UPDATE SET
        user_id = excluded.user_id,
        status = excluded.status,
        notes = excluded.notes,
        created_by = excluded.created_by,
        updated_at = CURRENT_TIMESTAMP
    `);

    await db.exec('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        await upsertStmt.run(
          userId,
          item.student_id,
          prayer_type_id,
          date,
          item.status || 'Hadir',
          item.notes || '',
          userId
        );
      }
      await db.exec('COMMIT');
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }

    return res.json({
      success: true,
      message: existingCount > 0 ? 'Data absensi berhasil diperbarui' : 'Data absensi berhasil disimpan',
      totalSaved: items.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Attendance History (Strictly user-scoped)
apiRouter.get('/attendance/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, class_id, prayer_type_id, status, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.gender,
        c.name as class_name,
        p.name as prayer_name,
        u.name as recorded_by_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN prayer_types p ON a.prayer_type_id = p.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.user_id = ? AND s.user_id = ?
    `;
    const params: (string | number)[] = [userId, userId];

    if (startDate) {
      query += ` AND a.attendance_date >= ?`;
      params.push(String(startDate));
    }
    if (endDate) {
      query += ` AND a.attendance_date <= ?`;
      params.push(String(endDate));
    }
    if (class_id && String(class_id) !== 'all' && String(class_id) !== '0') {
      query += ` AND s.class_id = ?`;
      params.push(Number(class_id));
    }
    if (prayer_type_id) {
      query += ` AND a.prayer_type_id = ?`;
      params.push(Number(prayer_type_id));
    }
    if (status) {
      query += ` AND a.status = ?`;
      params.push(String(status));
    }
    if (search) {
      query += ` AND s.name ILIKE ?`;
      params.push(`%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = (await db.prepare(countQuery).get(...params) as any).total;

    query += ` ORDER BY a.attendance_date DESC, p.sort_order ASC, s.name ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const records = await db.prepare(query).all(...params);

    return res.json({
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      records
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update single attendance record
apiRouter.put('/attendance/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, notes } = req.body;
    const id = req.params.id;

    if (!status) {
      return res.status(400).json({ error: 'Status absensi wajib diisi' });
    }

    const existing = await db.prepare('SELECT id FROM attendance WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Data absensi tidak ditemukan' });
    }

    await db.prepare(`
      UPDATE attendance
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(status, notes || '', id, userId);

    const updated = await db.prepare(`
      SELECT a.*, s.name as student_name, p.name as prayer_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN prayer_types p ON a.prayer_type_id = p.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(id, userId);

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= REPORTS & RECAP (User-scoped) =================
apiRouter.get('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, class_id, prayer_type_id, student_id } = req.query;

    let whereClause = `WHERE a.user_id = ? AND s.user_id = ?`;
    const params: (string | number)[] = [userId, userId];

    if (startDate) {
      whereClause += ` AND a.attendance_date >= ?`;
      params.push(String(startDate));
    }
    if (endDate) {
      whereClause += ` AND a.attendance_date <= ?`;
      params.push(String(endDate));
    }
    if (class_id && String(class_id) !== 'all' && String(class_id) !== '0') {
      whereClause += ` AND s.class_id = ?`;
      params.push(Number(class_id));
    }
    if (prayer_type_id) {
      whereClause += ` AND a.prayer_type_id = ?`;
      params.push(Number(prayer_type_id));
    } else {
      whereClause += ` AND a.prayer_type_id IN (SELECT id FROM prayer_types WHERE is_active = 1)`;
    }
    if (student_id) {
      whereClause += ` AND a.student_id = ?`;
      params.push(Number(student_id));
    }

    // Overall summary metrics
    const summaryQuery = `
      SELECT 
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ${whereClause}
    `;
    const summary = await db.prepare(summaryQuery).get(...params) as any;
    const total = summary?.total || 0;
    const hadir = summary?.hadir || 0;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

    // Student Recap Table
    const studentRecapQuery = `
      SELECT 
        s.id as student_id,
        s.name,
        s.gender,
        c.name as class_name,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id 
        AND a.user_id = ?
        ${startDate ? 'AND a.attendance_date >= ?' : ''} 
        ${endDate ? 'AND a.attendance_date <= ?' : ''}
        ${prayer_type_id ? 'AND a.prayer_type_id = ?' : 'AND a.prayer_type_id IN (SELECT id FROM prayer_types WHERE is_active = 1)'}
      WHERE s.is_active = 1 AND s.user_id = ? AND c.user_id = ?
      ${class_id && String(class_id) !== 'all' && String(class_id) !== '0' ? 'AND s.class_id = ?' : ''}
      ${student_id ? 'AND s.id = ?' : ''}
      GROUP BY s.id, s.name, s.gender, c.name
      ORDER BY c.name ASC, s.name ASC
    `;

    const studentRecapParams: (string | number)[] = [userId];
    if (startDate) studentRecapParams.push(String(startDate));
    if (endDate) studentRecapParams.push(String(endDate));
    if (prayer_type_id) studentRecapParams.push(Number(prayer_type_id));
    studentRecapParams.push(userId, userId);
    if (class_id && String(class_id) !== 'all' && String(class_id) !== '0') studentRecapParams.push(Number(class_id));
    if (student_id) studentRecapParams.push(Number(student_id));

    const studentRecap = await db.prepare(studentRecapQuery).all(...studentRecapParams) as any[];
    const studentRecapFormatted = studentRecap.map(s => {
      const sTotal = s.total || 0;
      const sHadir = s.hadir || 0;
      return {
        ...s,
        percentage: sTotal > 0 ? Math.round((sHadir / sTotal) * 100) : 0
      };
    });

    // Class Rankings
    const classRecapQuery = `
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.grade,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(a.id) as total_attendance,
        SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN a.status = 'Uzur' THEN 1 ELSE 0 END) as uzur
      FROM classes c
      JOIN students s ON s.class_id = c.id AND s.is_active = 1 AND s.user_id = ?
      LEFT JOIN attendance a ON a.student_id = s.id AND a.user_id = ?
        ${startDate ? 'AND a.attendance_date >= ?' : ''} 
        ${endDate ? 'AND a.attendance_date <= ?' : ''}
        ${prayer_type_id ? 'AND a.prayer_type_id = ?' : 'AND a.prayer_type_id IN (SELECT id FROM prayer_types WHERE is_active = 1)'}
      WHERE c.user_id = ?
      GROUP BY c.id, c.name, c.grade
      ORDER BY 
        CASE WHEN COUNT(a.id) > 0 THEN (CAST(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(a.id)) ELSE 0 END DESC
    `;
    const classRecapParams: (string | number)[] = [userId, userId];
    if (startDate) classRecapParams.push(String(startDate));
    if (endDate) classRecapParams.push(String(endDate));
    if (prayer_type_id) classRecapParams.push(Number(prayer_type_id));
    classRecapParams.push(userId);

    const classRecap = await db.prepare(classRecapQuery).all(...classRecapParams) as any[];
    const classRecapFormatted = classRecap.map(c => {
      const cTotal = c.total_attendance || 0;
      const cHadir = c.hadir || 0;
      const cTidakHadir = c.tidak_hadir || 0;
      const cIzin = c.izin || 0;
      const cSakit = c.sakit || 0;
      const cUzur = c.uzur || 0;
      return {
        ...c,
        percentage: cTotal > 0 ? Math.round((cHadir / cTotal) * 100) : 0,
        tidakHadirPct: cTotal > 0 ? Math.round((cTidakHadir / cTotal) * 100) : 0,
        izinPct: cTotal > 0 ? Math.round((cIzin / cTotal) * 100) : 0,
        sakitPct: cTotal > 0 ? Math.round((cSakit / cTotal) * 100) : 0,
        uzurPct: cTotal > 0 ? Math.round((cUzur / cTotal) * 100) : 0,
      };
    });

    return res.json({
      summary: {
        total,
        hadir,
        tidakHadir: summary?.tidak_hadir || 0,
        izin: summary?.izin || 0,
        sakit: summary?.sakit || 0,
        uzur: summary?.uzur || 0,
        percentage
      },
      students: studentRecapFormatted,
      classes: classRecapFormatted
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= NEON SERVICES ROUTES =================
apiRouter.get('/neon/health', async (req, res) => {
  try {
    const start = Date.now();
    const result = await db.queryOne('SELECT version(), current_database(), current_user, NOW() as current_time');
    const latency = Date.now() - start;

    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM users');
    const studentCount = await db.queryOne('SELECT COUNT(*) as count FROM students');
    const classCount = await db.queryOne('SELECT COUNT(*) as count FROM classes');
    const attendanceCount = await db.queryOne('SELECT COUNT(*) as count FROM attendance');
    const prayerCount = await db.queryOne('SELECT COUNT(*) as count FROM prayer_types');

    return res.json({
      status: 'healthy',
      service: 'Neon Lakebase Postgres',
      latencyMs: latency,
      database: result?.current_database,
      user: result?.current_user,
      postgresVersion: result?.version,
      stats: {
        users: Number(userCount?.count || 0),
        students: Number(studentCount?.count || 0),
        classes: Number(classCount?.count || 0),
        attendance: Number(attendanceCount?.count || 0),
        prayer_types: Number(prayerCount?.count || 0),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

apiRouter.get('/storage/status', (req, res) => {
  const status = neonStorage.getStatus();
  return res.json({
    service: 'Neon Object Storage',
    ...status,
  });
});

apiRouter.post('/storage/test-upload', async (req, res) => {
  try {
    const testContent = JSON.stringify({
      message: 'Neon Object Storage test upload',
      timestamp: new Date().toISOString(),
      appName: 'SIAS Absensi Solat',
    });
    const key = `test/test-${Date.now()}.json`;
    const result = await neonStorage.upload(key, testContent, 'application/json');
    const downloadUrl = await neonStorage.getDownloadUrl(key);
    return res.json({
      success: true,
      service: 'Neon Object Storage',
      key,
      downloadUrl,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================= ANNOUNCEMENT ROUTES (PENGUMUMAN SELURUH PENGGUNA SIAS) =================
apiRouter.get('/announcements/unread-count', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({ unreadCount: 0 });
    }
    const result = await db.prepare(`
      SELECT COUNT(*) as count
      FROM announcements a
      WHERE NOT EXISTS (
        SELECT 1 FROM announcement_views av
        WHERE av.announcement_id = a.id AND av.user_id = ?
      )
    `).get(userId) as any;
    return res.json({ unreadCount: Number(result?.count || 0) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/announcements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      try {
        await db.prepare(`
          INSERT INTO announcement_views (announcement_id, user_id)
          SELECT id, ? FROM announcements
          ON CONFLICT (announcement_id, user_id) DO NOTHING
        `).run(userId);
      } catch {
        // abaikan jika tabel sedang inisialisasi
      }
    }

    const list = await db.prepare(`
      SELECT 
        a.id, 
        a.user_id, 
        a.author_name, 
        a.title, 
        a.content, 
        a.category, 
        a.created_at,
        u.username as author_username, 
        u.name as author_full_name,
        u.role as author_role,
        COALESCE((
          SELECT COUNT(DISTINCT av.user_id) 
          FROM announcement_views av 
          WHERE av.announcement_id = a.id
        ), 0) as views_count
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all() as any[];

    const formattedList = (list || []).map((row) => ({
      ...row,
      views_count: Number(row.views_count || 0)
    }));

    return res.json({ announcements: formattedList });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/announcements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const username = req.user?.username?.toLowerCase();

    // Akun kamal atau role admin yang berhak membuat pengumuman untuk seluruh pengguna
    const isMasterAdmin = username === 'kamal' || userRole === 'admin';
    if (!isMasterAdmin) {
      return res.status(403).json({ error: 'Hanya pengelola utama SIAS (Kamal/Admin) yang dapat membuat pengumuman untuk seluruh pengguna.' });
    }

    const { title, content, category = 'general' } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
    }

    const authorName = req.user?.name || req.user?.username || 'Kamal';

    const insertRes = await db.prepare(`
      INSERT INTO announcements (user_id, author_name, title, content, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, authorName, title.trim(), content.trim(), category);

    const newAnnouncement = (await db.prepare(`
      SELECT 
        a.id, 
        a.user_id, 
        a.author_name, 
        a.title, 
        a.content, 
        a.category, 
        a.created_at,
        u.username as author_username, 
        u.name as author_full_name,
        u.role as author_role,
        0 as views_count
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(insertRes.lastInsertRowid)) || {
      id: insertRes.lastInsertRowid,
      user_id: userId,
      author_name: authorName,
      title: title.trim(),
      content: content.trim(),
      category,
      created_at: new Date().toISOString(),
      views_count: 0
    };

    return res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/announcements/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const username = req.user?.username?.toLowerCase();
    const isMasterAdmin = username === 'kamal' || userRole === 'admin';
    if (!isMasterAdmin) {
      return res.status(403).json({ error: 'Hanya pengelola utama SIAS (Kamal/Admin) yang berhak menghapus pengumuman.' });
    }

    const id = Number(req.params.id);
    await db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Pemberitahuan berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= FEEDBACK & APP EVALUATION ROUTES =================
apiRouter.post('/feedbacks', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, feedback, userName, userEmail } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating bintang harus antara 1 sampai 5.' });
    }

    const userId = req.user?.id || null;
    const resolvedName = (req.user?.name || userName || 'Pengguna SIAS').trim();
    const resolvedEmail = (req.user?.email || userEmail || null)?.trim();
    const trimmedFeedback = (feedback || '').trim();

    await db.prepare(`
      INSERT INTO feedbacks (user_id, user_name, user_email, rating, feedback)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, resolvedName, resolvedEmail, numericRating, trimmedFeedback);

    return res.status(201).json({
      success: true,
      message: 'Terima kasih atas masukan berharga Anda!'
    });
  } catch (error: any) {
    console.error('Error saving feedback:', error);
    return res.status(500).json({ error: error.message || 'Gagal menyimpan penilaian.' });
  }
});

apiRouter.get('/feedbacks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const username = req.user?.username?.toLowerCase();
    const isMasterAdmin = username === 'kamal' || userRole === 'admin';

    if (!isMasterAdmin) {
      return res.status(403).json({ error: 'Akses khusus Administrator untuk melihat evaluasi dan masukan pengguna.' });
    }

    const feedbacks = await db.prepare(`
      SELECT 
        f.id,
        f.user_id,
        f.user_name,
        f.user_email,
        f.rating,
        f.feedback,
        f.created_at,
        u.role as user_role,
        u.username as user_username
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 200
    `).all() as any[];

    // Hitung rata-rata dan distribusi rating
    const total = feedbacks.length;
    let sumRating = 0;
    const ratingCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const f of feedbacks) {
      const r = Number(f.rating) || 0;
      sumRating += r;
      if (r >= 1 && r <= 5) {
        ratingCounts[r] = (ratingCounts[r] || 0) + 1;
      }
    }

    const averageRating = total > 0 ? Number((sumRating / total).toFixed(1)) : 0;

    return res.json({
      total,
      averageRating,
      ratingCounts,
      feedbacks,
    });
  } catch (error: any) {
    console.error('Error fetching feedbacks:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengambil data masukan.' });
  }
});

apiRouter.delete('/feedbacks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const username = req.user?.username?.toLowerCase();
    const isMasterAdmin = username === 'kamal' || userRole === 'admin';

    if (!isMasterAdmin) {
      return res.status(403).json({ error: 'Hanya Administrator yang berhak menghapus ulasan.' });
    }

    const id = Number(req.params.id);
    await db.prepare('DELETE FROM feedbacks WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Masukan berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

