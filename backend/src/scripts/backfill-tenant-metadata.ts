import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { connectDatabase } from '../config/database.js';
import { getBranchModel } from '../modules/empresas/models/Branch.js';
import { getCompanyModel } from '../modules/empresas/models/Company.js';
import { getUserModel } from '../modules/usuarios/models/User.js';

async function main(): Promise<void> {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    await connectDatabase();
    const users = await getUserModel().find({}).select('companyId branchId').lean().exec();
    const references = new Map<string, Set<string>>();
    for (const user of users) {
      const companyId = String(user.companyId ?? '').trim();
      const branchId = String(user.branchId ?? '').trim();
      if (!companyId || !branchId) continue;
      const branches = references.get(companyId) ?? new Set<string>();
      branches.add(branchId);
      references.set(companyId, branches);
    }
    if (references.size === 0) {
      console.log('No se encontraron usuarios con empresa y sucursal asignadas; no se modific\u00f3 ning\u00fan dato.');
      return;
    }
    console.log('Base seleccionada: ' + env.MONGODB_DB_NAME);
    console.log('Se encontraron ' + references.size + ' empresas referenciadas. Solo se crear\u00e1n metadatos faltantes; usuarios y contrase\u00f1as no se modificar\u00e1n.');
    const confirmation = await prompt.question('Escribe MIGRAR para continuar: ');
    if (confirmation !== 'MIGRAR') {
      console.log('Cancelado. No se modific\u00f3 ning\u00fan dato.');
      return;
    }

    const Company = getCompanyModel();
    const Branch = getBranchModel();
    let companiesCreated = 0;
    let branchesCreated = 0;
    for (const [companyId, branchIds] of references) {
      const companyExists = await Company.exists({ _id: companyId });
      if (!companyExists) {
        const name = (await prompt.question('Nombre real de empresa ' + companyId + ': ')).trim();
        const taxId = (await prompt.question('Identificador fiscal real de ' + companyId + ': ')).trim();
        if (!name || !taxId) throw new Error('Se requieren nombre e identificador fiscal para crear la empresa.');
        await Company.create({ _id: companyId, name, taxId, status: 'ACTIVE' });
        companiesCreated += 1;
      }
      for (const branchId of branchIds) {
        const branchExists = await Branch.exists({ _id: branchId, companyId });
        if (branchExists) continue;
        const name = (await prompt.question('Nombre real de sucursal ' + branchId + ': ')).trim();
        const code = (await prompt.question('C\u00f3digo real de sucursal ' + branchId + ': ')).trim();
        const city = (await prompt.question('Ciudad real de sucursal ' + branchId + ': ')).trim();
        if (!name || !code || !city) throw new Error('Se requieren nombre, c\u00f3digo y ciudad para crear la sucursal.');
        await Branch.create({ _id: branchId, companyId, name, code, city, isActive: true });
        branchesCreated += 1;
      }
    }
    console.log('Metadatos creados: ' + companiesCreated + ' empresa(s), ' + branchesCreated + ' sucursal(es).');
    console.log('No se actualizaron documentos de usuario ni hashes de contrase\u00f1a.');
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No se pudo completar la migraci\u00f3n.');
  process.exitCode = 1;
});
