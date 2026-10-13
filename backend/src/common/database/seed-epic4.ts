import { Logger } from '@nestjs/common';

import { seedJobOffers } from '../../modules/job-offers/seeds/job-offers.seed.js';
import { SEED_TRANSACTION_OPTIONS } from '../constants/seed.constants.js';
import { createSeedClient } from './seeds.js';

// Siembra solo lo que necesita Publicar vacante (modalidades, tipos de contrato, estados,
// catálogo de tecnologías y empresas de ejemplo). Es idempotente: se puede repetir sin duplicar.
// No crea usuarios, eventos ni mentorías, a diferencia de `pnpm seed:run`.
async function main(): Promise<void> {
  const logger = new Logger('SeedEpic4');
  const client = createSeedClient();

  try {
    await client.$transaction(async (tx) => {
      await seedJobOffers(tx);
    }, SEED_TRANSACTION_OPTIONS);
    logger.log('Seed de Epic 4 completado: catálogos de vacantes, tecnologías y empresas de ejemplo.');
  } catch (error) {
    logger.error(
      'El seed de Epic 4 falló y la transacción se revirtió',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}

await main();
