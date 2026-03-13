import { NextResponse } from 'next/server';

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
    const adminCount = await db.admin.count();
    debug.database.adminCount = adminCount;

    // Verificar configuración
    const configCount = await db.configuracion.count();
    debug.database.configCount = configCount;

  } catch (error: any) {
    debug.database = {
      connected: false,
      error: error.message,
      code: error.code
    };
  }

  return NextResponse.json(debug, { status: 200 });
}
