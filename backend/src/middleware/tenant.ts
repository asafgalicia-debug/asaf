import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

export function tenant(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;

  if (!user) {
    next(new AppError({
      code: 'UNAUTHORIZED',
      message: 'Contexto de tenant no disponible',
      friendlyMessage: 'La sesión no está correctamente inicializada.',
      statusCode: 401
    }));
    return;
  }

  req.tenant = {
    companyId: user.companyId,
    branchId: user.branchId,
    userId: user.id
  };

  next();
}
