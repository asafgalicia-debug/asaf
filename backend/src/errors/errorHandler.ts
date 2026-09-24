import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    const invalidJson = new AppError({ code: 'INVALID_JSON', message: 'Malformed JSON request', friendlyMessage: 'El cuerpo de la solicitud no contiene JSON vÃ¡lido.', statusCode: 400 });
    res.status(invalidJson.statusCode).json({ ok: false, error: { code: invalidJson.code, message: invalidJson.friendlyMessage, errorId: invalidJson.errorId } });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ ok: false, error: { code: err.code, message: err.friendlyMessage, errorId: err.errorId } });
    return;
  }
  const internalError = new AppError({ code: 'INTERNAL', message: 'Unexpected server error', friendlyMessage: 'OcurriÃ³ un error inesperado. IntÃ©ntalo mÃ¡s tarde.', statusCode: 500 });
  res.status(internalError.statusCode).json({ ok: false, error: { code: internalError.code, message: internalError.friendlyMessage, errorId: internalError.errorId } });
}
