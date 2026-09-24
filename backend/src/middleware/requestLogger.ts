import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  // Log the path only; query strings can contain tokens or personal data.
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
}
