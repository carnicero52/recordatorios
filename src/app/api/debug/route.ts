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

    // Verificar configuración actual
    const config = await db.configuracion.findFirst();
    debug.config = {
      id: config?.id,
      gmailEmail: config?.gmailEmail,
      gmailActivo: config?.gmailActivo,
      gmailPasswordLength: config?.gmailPassword?.length || 0,
      telegramActivo: config?.telegramActivo,
      telegramTokenLength: config?.telegramBotToken?.length || 0,
    };

    // Verificar admin
    const admin = await db.admin.findFirst();
    debug.admin = admin ? {
      id: admin.id,
      username: admin.username,
      nombre: admin.nombre,
      activo: admin.activo,
      rol: admin.rol
    } : null;

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

// POST para probar guardar contraseña directamente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gmailEmail, gmailPassword } = body;

    const { db } = await import('@/lib/db');
    
    const config = await db.configuracion.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'No hay configuración' }, { status: 400 });
    }

    const updated = await db.configuracion.update({
      where: { id: config.id },
      data: {
        gmailEmail: gmailEmail || config.gmailEmail,
        gmailPassword: gmailPassword || config.gmailPassword,
        gmailActivo: true
      }
    });

    return NextResponse.json({
      success: true,
      saved: {
        gmailEmail: updated.gmailEmail,
        gmailPasswordLength: updated.gmailPassword?.length || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
