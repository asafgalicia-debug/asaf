import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';
import { classifyError } from './errorDiagnostics.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    const invalidJson = new AppError({ code: 'INVALID_JSON', message: 'Malformed JSON request', friendlyMessage: 'El cuerpo de la solicitud no contiene JSON válido.', statusCode: 400 });
    res.locals.errorId = invalidJson.errorId;
    res.status(invalidJson.statusCode).json({ ok: false, error: { code: invalidJson.code, message: invalidJson.friendlyMessage, errorId: invalidJson.errorId } });
    return;
  }
  if (err instanceof AppError) {
    res.locals.errorId = err.errorId;
    if (err.statusCode >= 500) console.error(JSON.stringify({ event: 'request_error', errorId: err.errorId, code: err.code, category: 'application', status: err.statusCode }));
    res.status(err.statusCode).json({ ok: false, error: { code: err.code, message: err.friendlyMessage, errorId: err.errorId } });
    return;
  }
  const internalError = new AppError({ code: 'INTERNAL', message: 'Unexpected server error', friendlyMessage: 'Ocurrió un error inesperado. Inténtalo más tarde.', statusCode: 500 });
  res.locals.errorId = internalError.errorId;
  console.error(JSON.stringify({ event: 'request_error', errorId: internalError.errorId, code: internalError.code, category: classifyError(err), status: 500 }));
  res.status(internalError.statusCode).json({ ok: false, error: { code: internalError.code, message: internalError.friendlyMessage, errorId: internalError.errorId } });
}
