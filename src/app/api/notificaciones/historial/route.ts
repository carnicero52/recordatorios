import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Historial de notificaciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const canal = searchParams.get('canal');
    const estado = searchParams.get('estado');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (canal) where.canal = canal;
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) where.createdAt.lte = new Date(fechaFin);
    }

    const notificaciones = await db.notificacion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        alerta: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
            prioridad: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(notificaciones);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
