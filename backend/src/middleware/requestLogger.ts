import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.once('finish', () => {
    // Route templates only: never log bodies, headers, query strings or URL identifiers.
    const route = typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
    console.log(JSON.stringify({ event: 'request_completed', method: req.method, route,
      status: res.statusCode, durationMs: Date.now() - started,
      ...(typeof res.locals.errorId === 'string' ? { errorId: res.locals.errorId } : {}) }));
  });
  next();
}
