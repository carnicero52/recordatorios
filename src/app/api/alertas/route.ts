import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar alertas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const usuarioId = searchParams.get('usuarioId');
    const tipo = searchParams.get('tipo');
    const prioridad = searchParams.get('prioridad');
    const categoriaId = searchParams.get('categoriaId');

    const where: any = {};
    if (estado) where.estado = estado;
    if (usuarioId) where.usuarioId = usuarioId;
    if (tipo) where.tipo = tipo;
    if (prioridad) where.prioridad = prioridad;
    if (categoriaId) where.categoriaId = categoriaId;

    const alertas = await db.alerta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            telegramId: true
          }
        },
        categoria: true,
        _count: {
          select: { notificaciones: true }
        }
      }
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

// POST - Crear alerta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descripcion,
      monto,
      tipo,
      fechaVencimiento,
      fechaProgramada,
      estado,
      prioridad,
      repetir,
      frecuencia,
      usuarioId,
      categoriaId
    } = body;

    if (!titulo || !usuarioId) {
      return NextResponse.json(
        { error: 'Título y usuario son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const alerta = await db.alerta.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        monto: monto ? parseFloat(monto) : null,
        tipo: tipo || 'pago',
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        estado: estado || 'pendiente',
        prioridad: prioridad || 'normal',
        repetir: repetir ?? false,
        frecuencia: frecuencia || null,
        usuarioId,
        categoriaId: categoriaId || null
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        categoria: true
      }
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error('Error creando alerta:', error);
    return NextResponse.json(
      { error: 'Error al crear alerta' },
      { status: 500 }
    );
  }
}
