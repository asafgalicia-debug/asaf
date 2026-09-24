import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { app } from '../src/app.js';

describe('ERP HTTP integration', () => {
  let server: Server;
  let baseUrl: string;
  beforeAll(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  it('serves liveness with security headers through the real HTTP stack', async () => {
    const response = await fetch(`${baseUrl}/health/live`);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('x-powered-by')).toBeNull();
    expect(await response.json()).toMatchObject({ ok: true, status: 'live', service: 'erp-api' });
  });
  it('serves API version metadata through the router', async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, data: { status: 'ok', api: 'v1' } });
  });
  it('exposes registered module manifests', async () => {
    const response = await fetch(`${baseUrl}/api/v1/modules`);
    const body = await response.json() as { ok: boolean; data: { modules: Array<{ id: string }> } };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.modules.some((module) => module.id === 'auth')).toBe(true);
  });
  it('requires authentication on protected module routes', async () => {
    const response = await fetch(`${baseUrl}/api/v1/notifications`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });
  it('rejects malformed JSON with a client error', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'INVALID_JSON' } });
  });
  it('does not log query-string values', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const response = await fetch(`${baseUrl}/health/live?access_token=not-for-logs`);
    expect(response.status).toBe(200);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/health/live'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('not-for-logs'));
    logSpy.mockRestore();
  });
  it('returns the standard JSON error for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/v1/does-not-exist`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } });
  });
});
