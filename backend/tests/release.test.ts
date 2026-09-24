import { describe, expect, it } from 'vitest';

import { getReleaseInfo } from '../src/modules/release/releaseService.js';

describe('release domain', () => {
  it('should expose the ERP release manifest and quality checks', () => {
    const release = getReleaseInfo();

    expect(release.name).toBe('erp-universal-modular');
    expect(release.version).toMatch(/\d+\.\d+\.\d+/);
    expect(release.status).toBe('ready');
    expect(release.checks.length).toBeGreaterThan(0);
    expect(release.checks.some((check) => check.name === 'build')).toBe(true);
  });
});
