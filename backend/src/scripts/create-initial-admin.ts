import 'dotenv/config';
import { createInterface } from 'node:readline';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { getUserModel } from '../modules/usuarios/models/User.js';
import { listRoles } from '../modules/roles/roleService.js';
import { hashPassword } from '../security/password.js';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function askHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Ejecuta este comando en una terminal interactiva para ocultar la contraseÃ±a.'));
  }
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') {
          process.stdin.removeListener('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          reject(new Error('OperaciÃ³n cancelada.'));
          return;
        }
        if (char === '\r' || char === '\n') {
          process.stdin.removeListener('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else if (char >= ' ') {
          value += char;
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    await connectDatabase();
    const User = getUserModel();
    if (await User.countDocuments({}).exec() !== 0) {
      throw new Error('La colecciÃ³n de usuarios ya tiene registros; el alta inicial solo funciona en una colecciÃ³n vacÃ­a.');
    }
    const name = (await ask(rl, 'Nombre del administrador: ')).trim();
    const email = (await ask(rl, 'Correo del administrador: ')).trim().toLowerCase();
    const companyId = (await ask(rl, 'ID de empresa para la sesiÃ³n inicial: ')).trim();
    const branchId = (await ask(rl, 'ID de sucursal para la sesiÃ³n inicial: ')).trim();
    rl.close();
    const password = await askHidden('ContraseÃ±a (mÃ­nimo 12 caracteres; no se mostrarÃ¡): ');
    if (!name || !email.includes('@') || !companyId || !branchId || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Datos incompletos o contraseÃ±a fuera del rango permitido (12 a 72 bytes).');
    }
    const adminRole = listRoles().find((role) => role.name === 'ADMIN');
    if (!adminRole) throw new Error('No se encontrÃ³ el rol ADMIN del sistema.');
    await User.create({ name, email, companyId, branchId, roleId: adminRole.id, permissions: adminRole.permissions, passwordHash: await hashPassword(password), isActive: true });
    console.log('Usuario administrador inicial creado. La contraseÃ±a no se guardÃ³ en texto plano.');
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No se pudo crear el administrador inicial.');
  process.exitCode = 1;
});