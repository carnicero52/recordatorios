import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Actualizar alerta
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que la alerta existe
    const alertaExistente = await db.alerta.findUnique({
      where: { id }
    });

    if (!alertaExistente) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    const alerta = await db.alerta.update({
      where: { id },
      data: {
        titulo: titulo || alertaExistente.titulo,
        descripcion: descripcion !== undefined ? descripcion : alertaExistente.descripcion,
        monto: monto !== undefined ? (monto ? parseFloat(monto) : null) : alertaExistente.monto,
        tipo: tipo || alertaExistente.tipo,
        fechaVencimiento: fechaVencimiento !== undefined ? (fechaVencimiento ? new Date(fechaVencimiento) : null) : alertaExistente.fechaVencimiento,
        fechaProgramada: fechaProgramada !== undefined ? (fechaProgramada ? new Date(fechaProgramada) : null) : alertaExistente.fechaProgramada,
        estado: estado || alertaExistente.estado,
        prioridad: prioridad || alertaExistente.prioridad,
        repetir: repetir !== undefined ? repetir : alertaExistente.repetir,
        frecuencia: frecuencia !== undefined ? frecuencia : alertaExistente.frecuencia,
        usuarioId: usuarioId || alertaExistente.usuarioId,
        categoriaId: categoriaId !== undefined ? categoriaId : alertaExistente.categoriaId
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

    return NextResponse.json(alerta);
  } catch (error) {
    console.error('Error actualizando alerta:', error);
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar alerta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la alerta existe
    const alerta = await db.alerta.findUnique({
      where: { id }
    });

    if (!alerta) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar notificaciones asociadas
    await db.notificacion.deleteMany({
      where: { alertaId: id }
    });

    // Eliminar alerta
    await db.alerta.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Alerta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando alerta:', error);
    return NextResponse.json(
      { error: 'Error al eliminar alerta' },
      { status: 500 }
    );
  }
}
