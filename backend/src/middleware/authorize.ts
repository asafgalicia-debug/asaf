import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

export function authorize(requiredPermission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const permissions = (req.user?.permissions ?? []) as string[];

    if (!permissions.includes(requiredPermission)) {
      next(new AppError({
        code: 'FORBIDDEN',
        message: `Permiso requerido: ${requiredPermission}`,
        friendlyMessage: 'No tienes permisos para realizar esta acción.',
        statusCode: 403
      }));
      return;
    }

    next();
  };
}
