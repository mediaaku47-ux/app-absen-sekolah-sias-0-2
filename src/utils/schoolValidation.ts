export type SchoolLevel = 'SD' | 'SMP' | 'SMA';

export interface SchoolLevelInfo {
  id: SchoolLevel;
  title: string;
  subtitle: string;
  grades: string;
  gradeList: string[];
  description: string;
}

export const SCHOOL_LEVELS: Record<SchoolLevel, SchoolLevelInfo> = {
  SD: {
    id: 'SD',
    title: 'SD / MI',
    subtitle: 'Sekolah Dasar / Madrasah Ibtidaiyah',
    grades: 'Kelas 1 s/d 6',
    gradeList: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
    description: 'Tingkat pendidikan dasar (6 tahun: Kelas 1-6)',
  },
  SMP: {
    id: 'SMP',
    title: 'SMP / MTs',
    subtitle: 'Sekolah Menengah Pertama / Madrasah Tsanawiyah',
    grades: 'Kelas 7 s/d 9',
    gradeList: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
    description: 'Tingkat pendidikan menengah pertama (3 tahun: Kelas 7-9)',
  },
  SMA: {
    id: 'SMA',
    title: 'SMA / SMK / MA',
    subtitle: 'Sekolah Menengah Atas / Kejuruan / Madrasah Aliyah',
    grades: 'Kelas 10 s/d 12',
    gradeList: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    description: 'Tingkat pendidikan menengah atas / kejuruan (3 tahun: Kelas 10-12)',
  },
};

/**
 * Mendeteksi jenjang sekolah secara otomatis dari nama sekolah
 */
export function detectLevelFromName(name: string): SchoolLevel | null {
  if (!name || typeof name !== 'string') return null;
  const s = name.trim().toUpperCase();
  if (!s) return null;

  // Pola regex spesifik dengan word boundaries
  const hasSD =
    /\b(SD|SDN|MIN|MIS)\b/.test(s) ||
    /\bSEKOLAH\s+DASAR\b/.test(s) ||
    /\bMADRASAH\s+IBTIDAIYAH\b/.test(s);

  const hasSMP =
    /\b(SMP|SMPN|SLTP|MTS|MTSN)\b/.test(s) ||
    /\bSEKOLAH\s+MENENGAH\s+PERTAMA\b/.test(s) ||
    /\bMADRASAH\s+TSANAWIYAH\b/.test(s);

  const hasSMA =
    /\b(SMA|SMAN|SMK|SMKN|SLTA|MAN|MAS)\b/.test(s) ||
    /\bSEKOLAH\s+MENENGAH\s+(ATAS|KEJURUAN)\b/.test(s) ||
    /\bMADRASAH\s+ALIYAH\b/.test(s) ||
    /\bMA\s+(NEGERI|SWASTA|PLUS|AL|DARUL|NUR|HIDAYAH|AL-)\b/.test(s);

  // Jika hanya cocok dengan satu jenjang, kembalikan jenjang tersebut
  if (hasSD && !hasSMP && !hasSMA) return 'SD';
  if (hasSMP && !hasSD && !hasSMA) return 'SMP';
  if (hasSMA && !hasSD && !hasSMP) return 'SMA';

  // Jika nama mengandung lebih dari satu indikator kata (ambigu) atau tidak ada kata kunci eksplisit
  return null;
}

export interface ValidationResult {
  valid: boolean;
  normalizedLevel: SchoolLevel;
  detectedLevel: SchoolLevel | null;
  error?: string;
}

/**
 * Memvalidasi kesesuaian antara nama sekolah dan kategori jenjang sekolah
 * Setiap sekolah harus terkategori tepat satu di antara 3: SD, SMP, atau SMA.
 */
export function validateSchoolCategory(
  schoolName: string,
  schoolLevel?: string
): ValidationResult {
  const rawLevel = (schoolLevel || '').trim().toUpperCase();
  let normalizedLevel: SchoolLevel = 'SMA';

  if (rawLevel === 'SD' || rawLevel.includes('SD') || rawLevel.includes('MI')) {
    normalizedLevel = 'SD';
  } else if (rawLevel === 'SMP' || rawLevel.includes('SMP') || rawLevel.includes('MTS')) {
    normalizedLevel = 'SMP';
  } else if (rawLevel === 'SMA' || rawLevel.includes('SMA') || rawLevel.includes('SMK') || rawLevel.includes('MA')) {
    normalizedLevel = 'SMA';
  } else {
    // Default jika tidak dikenali
    normalizedLevel = 'SMA';
  }

  const trimmedName = (schoolName || '').trim();
  if (!trimmedName) {
    return {
      valid: false,
      normalizedLevel,
      detectedLevel: null,
      error: 'Nama sekolah wajib diisi.',
    };
  }

  const detected = detectLevelFromName(trimmedName);

  // Jika terdeteksi jenjang eksplisit dan berbeda dengan jenjang yang dipilih
  if (detected && detected !== normalizedLevel) {
    const detectedInfo = SCHOOL_LEVELS[detected];
    const selectedInfo = SCHOOL_LEVELS[normalizedLevel];
    return {
      valid: false,
      normalizedLevel,
      detectedLevel: detected,
      error: `Nama sekolah "${trimmedName}" terindikasi untuk kategori ${detected} (${detectedInfo.title}), tidak sesuai dengan kategori jenjang ${normalizedLevel} (${selectedInfo.title}) yang dipilih. Harap sesuaikan nama sekolah atau ubah pilihan jenjang.`,
    };
  }

  return {
    valid: true,
    normalizedLevel,
    detectedLevel: detected,
  };
}
