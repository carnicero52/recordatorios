import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result: any = { steps: [] };

  try {
    // Agregar columna rol si no existe
    result.steps.push('Verificando columna rol en Admin...');

    try {
      await db.$executeRaw`ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "rol" TEXT NOT NULL DEFAULT 'admin'`;
      result.steps.push('✅ Columna rol agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna rol ya existe');
      } else {
        result.steps.push('⚠️ ' + e.message);
      }
    }

    // Agregar columna activo si no existe
    result.steps.push('Verificando columna activo en Admin...');
    try {
      await db.$executeRaw`ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true`;
      result.steps.push('✅ Columna activo agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna activo ya existe');
      } else {
        result.steps.push('⚠️ ' + e.message);
      }
    }

    // Verificar admin
    const admin = await db.admin.findFirst();
    result.admin = admin ? {
      id: admin.id,
      username: admin.username,
      nombre: admin.nombre
    } : null;

    result.success = true;
    result.message = 'Migración completada';

  } catch (error: any) {
    result.success = false;
    result.error = error.message;
  }

  return NextResponse.json(result);
}
