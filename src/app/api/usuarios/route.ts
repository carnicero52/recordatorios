import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');
    const activo = searchParams.get('activo');

    const where: any = {};
    if (rol) where.rol = rol;
    if (activo !== null) where.activo = activo === 'true';

    const usuarios = await db.usuario.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alertas: true }
        }
      }
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, telegramId, rol, recibirEmail, recibirTelegram } = body;

    if (!nombre || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existente = await db.usuario.findUnique({
      where: { email }
    });

    if (existente) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    const usuario = await db.usuario.create({
      data: {
        nombre,
        email,
        telefono: telefono || null,
        telegramId: telegramId || null,
        rol: rol || 'cliente',
        recibirEmail: recibirEmail ?? true,
        recibirTelegram: recibirTelegram ?? true
      }
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
