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

    // Agregar columnas de CallMeBot si no existen
    result.steps.push('Verificando columnas de CallMeBot...');

    try {
      await db.$executeRaw`ALTER TABLE "Configuracion" ADD COLUMN IF NOT EXISTS "callmebotApiKey" TEXT`;
      result.steps.push('✅ Columna callmebotApiKey agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna callmebotApiKey ya existe');
      } else {
        result.steps.push('⚠️ callmebotApiKey: ' + e.message);
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "Configuracion" ADD COLUMN IF NOT EXISTS "callmebotPhone" TEXT`;
      result.steps.push('✅ Columna callmebotPhone agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna callmebotPhone ya existe');
      } else {
        result.steps.push('⚠️ callmebotPhone: ' + e.message);
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "Configuracion" ADD COLUMN IF NOT EXISTS "callmebotActivo" BOOLEAN NOT NULL DEFAULT false`;
      result.steps.push('✅ Columna callmebotActivo agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna callmebotActivo ya existe');
      } else {
        result.steps.push('⚠️ callmebotActivo: ' + e.message);
      }
    }

    // Agregar columna enviarWhatsApp a Recordatorio
    result.steps.push('Verificando columna enviarWhatsApp en Recordatorio...');
    try {
      await db.$executeRaw`ALTER TABLE "Recordatorio" ADD COLUMN IF NOT EXISTS "enviarWhatsApp" BOOLEAN NOT NULL DEFAULT false`;
      result.steps.push('✅ Columna enviarWhatsApp agregada');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        result.steps.push('✅ Columna enviarWhatsApp ya existe');
      } else {
        result.steps.push('⚠️ enviarWhatsApp: ' + e.message);
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
