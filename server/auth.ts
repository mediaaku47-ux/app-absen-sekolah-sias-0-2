import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'absen-solat-sekolah-super-secret-key-2026';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi anda telah berakhir atau belum login. Silakan login kembali.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // Verify user still exists in DB
    const user = (await db.prepare('SELECT id, name, username, email, role FROM users WHERE id = ?').get(decoded.id)) as AuthUser | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token autentikasi tidak valid atau sudah kedaluwarsa' });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = (await db.prepare('SELECT id, name, username, email, role FROM users WHERE id = ?').get(decoded.id)) as AuthUser | undefined;
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
}

