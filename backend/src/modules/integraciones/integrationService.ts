import { AppError } from '../../errors/AppError.js';
import { getIntegrationModel, type IntegrationProvider, type IntegrationType } from './models/Integration.js';

const providers: IntegrationProvider[] = ['erp', 'salesforce', 'hubspot', 'shopify', 'sap', 'custom'];
const types: IntegrationType[] = ['crm', 'billing', 'bank', 'ecommerce', 'logistics', 'email', 'ai'];
const secretKey = /(secret|token|password|passwd|api[-_]?key|authorization|credential|private[-_]?key)/i;

function assertSafeConfig(value: unknown, depth = 0): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 4) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Integration config must be a small object', friendlyMessage: 'La configuraciÃ³n debe ser un objeto sencillo sin credenciales.', statusCode: 400 });
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 40) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Integration config too large', friendlyMessage: 'La configuraciÃ³n contiene demasiados campos.', statusCode: 400 });
  for (const [key, item] of entries) {
    if (secretKey.test(key)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Secrets cannot be stored in integration config', friendlyMessage: 'No guardes contraseÃ±as, tokens ni llaves aquÃ­; se configurarÃ¡n con un gestor de secretos al conectar el proveedor.', statusCode: 400 });
    if (item && typeof item === 'object') assertSafeConfig(item, depth + 1);
    else if (typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean' && item !== null) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unsupported integration config value', friendlyMessage: 'La configuraciÃ³n contiene un valor no admitido.', statusCode: 400 });
    }
  }
}

function serialize(row: Record<string, any>): Record<string, unknown> {
  const { _id, lastError: _lastError, ...rest } = row;
  return { id: String(_id), ...rest };
}

export async function listIntegrations(companyId: string, branchId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await getIntegrationModel().find({ companyId, branchId }).sort({ updatedAt: -1 }).lean().exec();
  return rows.map((row) => serialize(row as Record<string, any>));
}

export async function createIntegration(input: {
  companyId: string; branchId: string; createdBy: string; name: string;
  provider: IntegrationProvider; type: IntegrationType; config?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const createdBy = input.createdBy.trim();
  const name = input.name.trim();
  const config = input.config ?? {};
  if (!companyId || !branchId || !createdBy || !name || name.length > 120 || !providers.includes(input.provider) || !types.includes(input.type)) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid integration input', friendlyMessage: 'Revisa el nombre, proveedor y tipo de integraciÃ³n.', statusCode: 400 });
  }
  assertSafeConfig(config);
  const row = await getIntegrationModel().create({ companyId, branchId, createdBy, name, provider: input.provider, type: input.type, status: 'PAUSED', config, lastError: undefined });
  return serialize(row.toObject() as Record<string, any>);
}
