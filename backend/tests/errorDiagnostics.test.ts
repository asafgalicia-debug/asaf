import { describe, expect, it, vi } from 'vitest';
import { classifyError } from '../src/errors/errorDiagnostics.js';
import { errorHandler } from '../src/errors/errorHandler.js';
import { requestLogger } from '../src/middleware/requestLogger.js';
import type { Request, Response, NextFunction } from 'express';

describe('safe error diagnostics', () => {
  it('classifies errors without forwarding their contents', () => {
    const failure = new Error('mongodb://private:secret@host'); failure.name = 'MongoServerError';
    expect(classifyError(failure)).toBe('database_server');
    expect(classifyError(new Error('private'))).toBe('unexpected');
    expect(classifyError({ name: 'MongoServerError' })).toBe('unknown');
  });
  it('logs a safe category and correlates it with the response', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const failure = new TypeError('secret token and personal data');
      const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn() };
      errorHandler(failure, {} as Request, res as unknown as Response, vi.fn() as NextFunction);
      const logged = JSON.parse(spy.mock.calls[0][0]);
      expect(logged.category).toBe('type_error');
      expect(logged.errorId).toBe(res.json.mock.calls[0][0].error.errorId);
      expect(JSON.stringify(spy.mock.calls)).not.toContain('secret');
    } finally { spy.mockRestore(); }
  });
  it('completion logs exclude request secrets and identifiers', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      let finish: () => void = () => {};
      const req = { method: 'GET', route: { path: '/:id' }, originalUrl: '/private?token=secret', body: { password: 'secret' } };
      const res = { statusCode: 500, locals: { errorId: 'err_test' }, once: (_event: string, callback: () => void) => { finish = callback; } };
      const next = vi.fn();
      requestLogger(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalled(); finish();
      expect(JSON.parse(spy.mock.calls[0][0])).toMatchObject({ route: '/:id', status: 500, errorId: 'err_test' });
      expect(JSON.stringify(spy.mock.calls)).not.toContain('secret');
    } finally { spy.mockRestore(); }
  });
});
