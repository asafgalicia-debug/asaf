const url = 'http://127.0.0.1:' + (process.env.PORT || '4000') + '/health/ready';

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (response.ok) {
    console.log('MongoDB readiness OK: Atlas respondió al ping.');
    process.exit(0);
  }
  const result = await response.json().catch(() => ({})) as { database?: string };
  console.error('MongoDB readiness NO: HTTP ' + response.status + '; estado ' + (result.database ?? 'no disponible') + '.');
  process.exit(1);
} catch {
  console.error('No se pudo consultar /health/ready. Confirma que el backend esté ejecutándose.');
  process.exit(1);
}
