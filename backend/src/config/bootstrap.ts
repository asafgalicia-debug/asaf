import { connectDatabase } from './database.js';
import { env } from './env.js';

export async function bootstrap(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.warn('[BOOTSTRAP] MongoDB no está configurado; readiness no disponible.');
    return;
  }

  try {
    await connectDatabase();
    console.log('[BOOTSTRAP] MongoDB disponible y ping confirmado.');
  } catch {
    // No imprimir el error del driver: puede contener detalles de conexión.
    console.error('[BOOTSTRAP] MongoDB no disponible; readiness no disponible.');
  }
}
