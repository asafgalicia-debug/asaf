import { describe, expect, it } from 'vitest';

import { getModuleConfig, listModuleConfigs } from '../src/modules/configuracion/configService.js';

describe('config domain', () => {
  it('should list configuration entries for the company', () => {
    const configs = listModuleConfigs('company-demo-01');

    expect(configs.length).toBeGreaterThan(0);
    expect(configs[0].module).toBe('auth');
  });

  it('should return a specific module configuration', () => {
    const config = getModuleConfig('company-demo-01', 'sales');

    expect(config.companyId).toBe('company-demo-01');
    expect(config.module).toBe('sales');
  });
});
