import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { verifyToken } from '../security/jwt.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación faltante',
      friendlyMessage: 'Debes iniciar sesión para continuar.',
      statusCode: 401
    }));
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      branchId: payload.branchId,
      roleId: payload.roleId,
      permissions: payload.permissions ?? []
    };
    next();
  } catch {
    next(new AppError({
      code: 'UNAUTHORIZED',
      message: 'Token inválido o expirado',
      friendlyMessage: 'Tu sesión ha expirado o el token es inválido.',
      statusCode: 401
    }));
  }
}
