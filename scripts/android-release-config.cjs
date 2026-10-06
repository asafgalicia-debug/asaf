function validateReleaseApiUrl(value) {
  if (!value) throw new Error('Configura EXPO_PUBLIC_API_URL con la dirección HTTPS de la API antes de compilar Android release.');
  let url;
  try { url = new URL(value); } catch { throw new Error('EXPO_PUBLIC_API_URL no es una URL válida.'); }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '[::1]' || hostname === '[::]' ||
      /^127\./.test(hostname) || hostname === '0.0.0.0' ||
      url.pathname.replace(/\/+$/, '') !== '/api/v1') {
    throw new Error('La API de release debe usar HTTPS, terminar en /api/v1 y no incluir localhost, credenciales ni parámetros.');
  }
  return url.toString().replace(/\/+$/, '');
}

module.exports = { validateReleaseApiUrl };
