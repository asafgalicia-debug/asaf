import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError({
      code: 'NOT_FOUND',
      message: `Endpoint no encontrado: ${req.originalUrl}`,
      friendlyMessage: 'La ruta solicitada no existe.',
      statusCode: 404
    })
  );
}
