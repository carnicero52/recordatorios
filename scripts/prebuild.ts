import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Detectar si estamos en Vercel/producción
const isVercel = process.env.VERCEL === '1' || process.env.DATABASE_URL?.includes('postgresql');

console.log(`🚀 Build environment: ${isVercel ? 'Production (Vercel/PostgreSQL)' : 'Development (SQLite)'}`);

if (isVercel) {
  // Usar schema de PostgreSQL para producción
  const postgresSchema = path.join(process.cwd(), 'prisma', 'schema.postgresql.prisma');
  const targetSchema = path.join(process.cwd(), 'prisma', 'schema.prisma');

  if (fs.existsSync(postgresSchema)) {
    console.log('📦 Copiando schema de PostgreSQL...');
    fs.copyFileSync(postgresSchema, targetSchema);
    console.log('✅ Schema de PostgreSQL copiado');
  }

  // Generar cliente de Prisma
  console.log('🔧 Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push del schema a la base de datos
  console.log('📊 Sincronizando base de datos...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

  // Ejecutar seed
  console.log('🌱 Ejecutando seed...');
  execSync('npx prisma db seed', { stdio: 'inherit' });

  console.log('✅ Prebuild completado');
}
