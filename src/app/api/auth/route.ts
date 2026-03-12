import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

// Función para hashear contraseña
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// POST - Login de admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username y password son requeridos' },
        { status: 400 }
      );
    }

    // Buscar admin
    let admin = await db.admin.findFirst({
      where: { username, activo: true }
    });

    // Si no existe ningún admin, crear el admin inicial
    if (!admin) {
      const adminCount = await db.admin.count();
      if (adminCount === 0) {
        admin = await db.admin.create({
          data: {
            username: 'admin',
            password: hashPassword('admin123'),
            nombre: 'Administrador',
            activo: true
          }
        });
      }
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña (soportar hash y texto plano para retrocompatibilidad)
    const hashedPassword = hashPassword(password);
    const passwordMatch = admin.password === hashedPassword || admin.password === password;

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token simple
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nombre: admin.nombre,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    // Decodificar token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [adminId] = decoded.split(':');

    const admin = await db.admin.findFirst({
      where: { id: adminId, activo: true }
    });

    if (!admin) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id: admin.id,
        username: admin.username,
        nombre: admin.nombre,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    return NextResponse.json(
      { valid: false, error: 'Token inválido' },
      { status: 401 }
    );
  }
}
