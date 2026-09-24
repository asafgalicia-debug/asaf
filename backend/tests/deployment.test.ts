import { describe, expect, it } from 'vitest';

import { getDeploymentStatus } from '../src/modules/deployment/deploymentService.js';

describe('deployment domain', () => {
  it('should expose the ERP deployment status and readiness metadata', () => {
    const status = getDeploymentStatus();

    expect(status.service).toBe('erp-api');
    expect(status.version).toMatch(/\d+\.\d+\.\d+/);
    expect(status.environment).toBeTruthy();
    expect(status.modules.length).toBeGreaterThan(0);
    expect(status.readyForProduction).toBe(true);
    expect(status.deploymentTargets.some((target) => target.type === 'docker')).toBe(true);
    expect(status.deploymentTargets.some((target) => target.type === 'web')).toBe(true);
  });
});
