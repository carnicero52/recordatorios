import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  const debug: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  };

  try {
    const { db } = await import('@/lib/db');
    
    // Verificar conexión
    await db.$connect();
    debug.database = { connected: true };

    // Verificar tablas
    const tablas = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    debug.database.tables = tablas;

    // Verificar admin
    const admin = await db.admin.findFirst();
    debug.database.admin = admin ? {
      id: admin.id,
      username: admin.username,
      nombre: admin.nombre,
      passwordLength: admin.password.length,
      passwordPrefix: admin.password.substring(0, 10) + '...',
      activo: admin.activo
    } : null;

    // Probar bcrypt
    if (admin) {
      const testPassword = 'admin123';
      const passwordMatch = await bcrypt.compare(testPassword, admin.password);
      debug.database.passwordTest = {
        testPassword,
        matches: passwordMatch
      };

      // Generar nuevo hash
      const newHash = await bcrypt.hash(testPassword, 10);
      debug.database.newHash = newHash;
    }

    // Verificar configuración
    const configCount = await db.configuracion.count();
    debug.database.configCount = configCount;

  } catch (error: any) {
    debug.database = {
      connected: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    };
  }

  return NextResponse.json(debug, { status: 200 });
}
