import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool, types } = pg;

// Keep DATE columns as string 'YYYY-MM-DD' without timezone conversion
types.setTypeParser(1082, (val: string) => val);

// Resolve connection string from environment variables (Neon / Netlify / Cloud)
const envConnectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NETLIFY_DATABASE_URL;

const defaultNeonString =
  'postgresql://neondb_owner:npg_To0dsF1LDlkM@ep-summer-waterfall-a1r518z5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const connectionString = envConnectionString || defaultNeonString;

if (envConnectionString) {
  console.log('[Neon Postgres] Using connection string from environment variable (DATABASE_URL / NEON_DATABASE_URL / POSTGRES_URL).');
} else {
  console.log('[Neon Postgres] DATABASE_URL not set in env, using default Neon project connection string.');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

/**
 * Converts SQLite-style query string to PostgreSQL-compatible query
 * 1. Replaces ? placeholders with $1, $2, ...
 * 2. Replaces SQLite date functions like date(?, '-6 days') with ($1::date - INTERVAL '6 days')
 * 3. Converts INSERT OR REPLACE INTO app_settings to ON CONFLICT (key) DO UPDATE
 * 4. Appends RETURNING id for INSERT statements if not present so lastInsertRowid can be retrieved
 */
function toPgSql(sql: string): string {
  let transformed = sql.trim();

  // Convert INSERT OR REPLACE INTO user_settings
  if (/INSERT\s+OR\s+REPLACE\s+INTO\s+user_settings/i.test(transformed)) {
    transformed = transformed.replace(
      /INSERT\s+OR\s+REPLACE\s+INTO\s+user_settings\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
      'INSERT INTO user_settings ($1) VALUES ($2) ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP'
    );
  }

  // Replace ? with $1, $2, etc.
  let paramIndex = 1;
  transformed = transformed.replace(/\?/g, () => `$${paramIndex++}`);

  // Convert AS FLOAT to AS numeric for Postgres
  transformed = transformed.replace(/AS\s+FLOAT/gi, 'AS numeric');

  // Replace date($X, '-6 days') or similar date math with PostgreSQL INTERVAL
  transformed = transformed.replace(
    /date\(\s*\$([0-9]+)\s*,\s*'-(\d+)\s+days'\s*\)/gi,
    '($$$1::date - INTERVAL \'$2 days\')'
  );

  // For INSERT statements, append RETURNING id if not already returning anything
  if (/^\s*INSERT\s+INTO/i.test(transformed) && !/RETURNING/i.test(transformed)) {
    if (/INTO\s+user_settings/i.test(transformed)) {
      transformed += ' RETURNING key';
    } else {
      transformed += ' RETURNING id';
    }
  }

  return transformed;
}

function flattenParams(params: any[]): any[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

export const db = {
  pool,

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, flattenParams(params));
    return res.rows as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, flattenParams(params));
    return (res.rows[0] as T) || null;
  },

  async execute(sql: string, params: any[] = []): Promise<{ lastInsertRowid?: number | string; changes: number }> {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, flattenParams(params));
    const firstRow = res.rows && res.rows[0];
    const lastInsertRowid = firstRow ? (firstRow.id ?? firstRow.key) : undefined;
    return { lastInsertRowid, changes: res.rowCount ?? 0 };
  },

  async exec(sql: string): Promise<void> {
    await pool.query(sql);
  },

  prepare(sql: string) {
    return {
      get: async (...params: any[]) => {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flattenParams(params));
        return res.rows[0];
      },
      all: async (...params: any[]) => {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flattenParams(params));
        return res.rows;
      },
      run: async (...params: any[]) => {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flattenParams(params));
        const firstRow = res.rows && res.rows[0];
        const lastInsertRowid = firstRow ? (firstRow.id ?? firstRow.key) : undefined;
        return { lastInsertRowid, changes: res.rowCount ?? 0 };
      },
    };
  },
};

export async function initDatabase() {
  console.log('[Neon Postgres] Initializing schema and seed records...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      semester VARCHAR(50) NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(50) NOT NULL,
      academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      gender VARCHAR(50) NOT NULL,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE classes DROP COLUMN IF EXISTS homeroom_teacher;
    ALTER TABLE students DROP COLUMN IF EXISTS nis;

    -- Add user_id column to existing tables if not present
    ALTER TABLE classes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

    CREATE TABLE IF NOT EXISTS prayer_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      prayer_type_id INTEGER NOT NULL REFERENCES prayer_types(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL,
      notes TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_attendance UNIQUE (student_id, prayer_type_id, attendance_date)
    );

    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

    -- Drop legacy app_settings table as user_settings is now the single authoritative settings table
    DROP TABLE IF EXISTS app_settings CASCADE;

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key VARCHAR(100) NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      author_name VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'general',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcement_views (
      id SERIAL PRIMARY KEY,
      announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(announcement_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcement_views_ann_id ON announcement_views(announcement_id);
    UPDATE users SET role = 'admin' WHERE username = 'kamal';
  `);

  // Seed default prayer types if empty
  const prayerCount = (await db.prepare('SELECT COUNT(*) as count FROM prayer_types').get()) as { count: string | number };
  if (Number(prayerCount.count) === 0) {
    const defaultPrayers = [
      { name: 'Subuh', sort_order: 1 },
      { name: 'Zuhur', sort_order: 2 },
      { name: 'Asar', sort_order: 3 },
      { name: 'Maghrib', sort_order: 4 },
      { name: 'Isya', sort_order: 5 },
    ];
    for (const prayer of defaultPrayers) {
      await db.prepare(`
        INSERT INTO prayer_types (name, is_active, sort_order)
        VALUES (?, 1, ?)
      `).run(prayer.name, prayer.sort_order);
    }
  }

  // Migration: Assign any orphaned data to the primary user if available
  const firstUser = (await db.prepare("SELECT id FROM users ORDER BY id ASC LIMIT 1").get()) as { id: number } | undefined;
  if (firstUser?.id) {
    const ownerId = firstUser.id;
    await db.exec(`
      UPDATE classes SET user_id = ${ownerId} WHERE user_id IS NULL;
      UPDATE students SET user_id = ${ownerId} WHERE user_id IS NULL;
      UPDATE attendance SET user_id = COALESCE(created_by, ${ownerId}) WHERE user_id IS NULL;
      UPDATE attendance SET created_by = ${ownerId} WHERE created_by IS NULL;
      UPDATE academic_years SET user_id = ${ownerId} WHERE user_id IS NULL;
    `);
  }

  console.log('[Neon Postgres] Database successfully initialized with multi-tenant user isolation.');
}

export async function getUserSettings(userId: number): Promise<Record<string, string>> {
  const userRows = (await db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(userId)) as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {
    school_name: '',
    school_level: 'SMA',
    system_title: 'Sistem Informasi Absensi Solat',
  };
  for (const r of userRows) {
    map[r.key] = r.value;
  }

  // Aliases for compatibility
  if (map.solat_pilihan) {
    map.permanent_prayers = map.solat_pilihan;
    map.prayers = map.solat_pilihan;
  } else if (map.permanent_prayers) {
    map.solat_pilihan = map.permanent_prayers;
    map.prayers = map.permanent_prayers;
  } else {
    map.solat_pilihan = JSON.stringify(['Zuhur', 'Asar']);
    map.permanent_prayers = map.solat_pilihan;
    map.prayers = map.solat_pilihan;
  }

  return map;
}

export async function setUserSetting(userId: number, key: string, value: string): Promise<void> {
  await db.prepare(`
    INSERT INTO user_settings (user_id, key, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
  `).run(userId, key, value);
}

export async function clearAllDataAndHistory(userId: number) {
  try {
    await db.prepare('DELETE FROM attendance WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM students WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM classes WHERE user_id = ?').run(userId);
    console.log(`[Neon Postgres] Seluruh data murid, kelas, dan riwayat absensi milik user ${userId} telah dikosongkan.`);
  } catch (err) {
    console.error('[Neon Postgres] Gagal mengosongkan data:', err);
  }
}

export async function ensureUserClasses(userId: number, schoolLevel: string = 'SMA') {
  const existingCount = (await db.prepare('SELECT COUNT(*) as count FROM classes WHERE user_id = ?').get(userId)) as { count: string | number };
  if (Number(existingCount.count) === 0) {
    await syncClassesForSchool(userId, '', schoolLevel);
  }
}

export async function syncClassesForSchool(userId: number, schoolName?: string, explicitLevel?: string) {
  const s = (schoolName || '').toUpperCase().trim();
  const lvl = (explicitLevel || '').toUpperCase().trim();
  let targetGrades: { name: string; grade: string }[] = [];

  // Jenjang 1: SD / MI (Kelas 1 - 6)
  if (
    lvl === 'SD' ||
    (!lvl && (/\b(SD|MI|SDN|MIN|MIS)\b/.test(s) || /SEKOLAH DASAR|IBTIDAIYAH/.test(s)))
  ) {
    targetGrades = [
      { name: 'Kelas 1', grade: '1' },
      { name: 'Kelas 2', grade: '2' },
      { name: 'Kelas 3', grade: '3' },
      { name: 'Kelas 4', grade: '4' },
      { name: 'Kelas 5', grade: '5' },
      { name: 'Kelas 6', grade: '6' },
    ];
  }
  // Jenjang 2: SMP / MTs (Kelas 7 - 9)
  else if (
    lvl === 'SMP' ||
    (!lvl && (/\b(SMP|MTS|SLTP|SMPN|MTSN)\b/.test(s) || /MENENGAH PERTAMA|TSANAWIYAH/.test(s)))
  ) {
    targetGrades = [
      { name: 'Kelas 7', grade: '7' },
      { name: 'Kelas 8', grade: '8' },
      { name: 'Kelas 9', grade: '9' },
    ];
  }
  // Jenjang 3: SMA / SMK / MA (Kelas 10 - 12)
  else {
    targetGrades = [
      { name: 'Kelas 10', grade: '10' },
      { name: 'Kelas 11', grade: '11' },
      { name: 'Kelas 12', grade: '12' },
    ];
  }

  if (targetGrades.length === 0) return;

  // Active academic year for this user
  let activeAy = (await db.prepare('SELECT id FROM academic_years WHERE user_id = ? AND is_active = 1 LIMIT 1').get(userId)) as { id: number } | undefined;
  if (!activeAy) {
    const ay = await db.prepare(`
      INSERT INTO academic_years (user_id, name, semester, is_active)
      VALUES (?, '2025/2026', 'Genap', 1)
    `).run(userId);
    activeAy = { id: Number(ay.lastInsertRowid) };
  }
  const ayId = activeAy.id;

  const existingClasses = (await db.prepare('SELECT id, name, grade FROM classes WHERE user_id = ? ORDER BY id ASC').all(userId)) as Array<{ id: number; name: string; grade: string }>;
  
  if (existingClasses.length === 0) {
    for (const target of targetGrades) {
      await db.prepare(`
        INSERT INTO classes (user_id, name, grade, academic_year_id)
        VALUES (?, ?, ?, ?)
      `).run(userId, target.name, target.grade, ayId);
    }
    return;
  }

  // Check if current classes already have matching names
  const currentNames = existingClasses.map((c) => c.name);
  const targetNames = targetGrades.map((t) => t.name);
  const isExactMatch =
    currentNames.length === targetNames.length && targetNames.every((n, idx) => currentNames[idx] === n);

  if (isExactMatch) return;

  const newClassIds: number[] = [];

  for (let i = 0; i < targetGrades.length; i++) {
    const target = targetGrades[i];
    if (i < existingClasses.length) {
      await db.prepare(`
        UPDATE classes
        SET name = ?, grade = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(target.name, target.grade, existingClasses[i].id, userId);
      newClassIds.push(existingClasses[i].id);
    } else {
      const ins = await db.prepare(`
        INSERT INTO classes (user_id, name, grade, academic_year_id)
        VALUES (?, ?, ?, ?)
      `).run(userId, target.name, target.grade, ayId);
      newClassIds.push(Number(ins.lastInsertRowid));
    }
  }

  // Remove extra classes if previous level had more
  if (existingClasses.length > targetGrades.length) {
    const keepIds = existingClasses.slice(0, targetGrades.length).map((c) => c.id);
    const extraClasses = existingClasses.slice(targetGrades.length);
    for (const ec of extraClasses) {
      await db.prepare('UPDATE students SET class_id = ? WHERE class_id = ? AND user_id = ?').run(keepIds[0], ec.id, userId);
      await db.prepare('DELETE FROM classes WHERE id = ? AND user_id = ?').run(ec.id, userId);
    }
  }

  // Distribute students evenly among the new classes
  const allStudents = (await db.prepare('SELECT id FROM students WHERE user_id = ? ORDER BY id ASC').all(userId)) as Array<{ id: number }>;
  if (allStudents.length > 0 && newClassIds.length > 0) {
    for (let index = 0; index < allStudents.length; index++) {
      const student = allStudents[index];
      const targetClassId = newClassIds[index % newClassIds.length];
      await db.prepare('UPDATE students SET class_id = ? WHERE id = ? AND user_id = ?').run(targetClassId, student.id, userId);
    }
  }
}
