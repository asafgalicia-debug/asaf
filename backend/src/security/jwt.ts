import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type JwtPayload = {
  sub: string;
  email?: string;
  companyId?: string;
  branchId?: string;
  roleId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
};

function getJwtSecret(): string {
  const secret = env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 64) {
    throw new Error('JWT_SECRET no estÃ¡ configurado correctamente.');
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}