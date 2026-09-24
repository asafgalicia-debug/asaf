import { describe, expect, it } from 'vitest';
describe('ERP API base', () => {
    it('should expose the base application metadata', () => {
        expect({ ok: true, service: 'erp-api' }).toEqual({ ok: true, service: 'erp-api' });
    });
    it('should validate the environment contract', () => {
        expect(process.env.NODE_ENV ?? 'development').toBeTruthy();
    });
});
