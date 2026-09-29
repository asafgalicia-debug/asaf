const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const androidDir = path.resolve(__dirname, '../apps/mobile/android');
const env = {
  ...process.env,
  NODE_ENV: 'production',
  // Expo 52 receives entry paths relative to the mobile app from Gradle.
  EXPO_NO_METRO_WORKSPACE_ROOT: '1',
};

if (process.platform === 'win32') {
  const jdkDir = path.join(env.USERPROFILE || '', '.jdks');
  const candidates = [
    env.JAVA_HOME,
    ...(fs.existsSync(jdkDir)
      ? fs.readdirSync(jdkDir).map((name) => path.join(jdkDir, name))
      : []),
    path.join(env.ProgramFiles || 'C:\\Program Files', 'Android/Android Studio/jbr'),
  ].filter(Boolean);
  const javaHome = candidates.find((candidate) => {
    const result = spawnSync(path.join(candidate, 'bin/java.exe'), ['-version'], { encoding: 'utf8' });
    const version = `${result.stdout || ''}${result.stderr || ''}`.match(/version "(\d+)/);
    return result.status === 0 && version && [17, 21].includes(Number(version[1]));
  });
  if (!javaHome) {
    console.error('Falta Java 17 o 21. Instala un JDK compatible y configura JAVA_HOME.');
    process.exit(1);
  }
  env.JAVA_HOME = javaHome;
  console.log(`Java: ${javaHome}`);
}

console.log('Compilando apps/mobile para Android (release)...');
const result = spawnSync(
  process.platform === 'win32' ? (env.ComSpec || 'cmd.exe') : './gradlew',
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'gradlew.bat :app:assembleRelease --console=plain']
    : [':app:assembleRelease', '--console=plain'],
  { cwd: androidDir, env, stdio: 'inherit' },
);
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status || 1);
console.log(`APK: ${path.join(androidDir, 'app/build/outputs/apk/release/app-release.apk')}`);
console.log('Esta configuracion usa firma de desarrollo; no es una firma para publicar en Google Play.');
