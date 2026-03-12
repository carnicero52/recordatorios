import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Actualizar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, telefono, telegramId, rol, recibirEmail, recibirTelegram, activo } = body;

    // Verificar que el usuario existe
    const usuarioExistente = await db.usuario.findUnique({
      where: { id }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando el email, verificar que no exista
    if (email && email !== usuarioExistente.email) {
      const emailExistente = await db.usuario.findUnique({
        where: { email }
      });
      if (emailExistente) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    const usuario = await db.usuario.update({
      where: { id },
      data: {
        nombre: nombre || usuarioExistente.nombre,
        email: email || usuarioExistente.email,
        telefono: telefono !== undefined ? telefono : usuarioExistente.telefono,
        telegramId: telegramId !== undefined ? telegramId : usuarioExistente.telegramId,
        rol: rol || usuarioExistente.rol,
        recibirEmail: recibirEmail !== undefined ? recibirEmail : usuarioExistente.recibirEmail,
        recibirTelegram: recibirTelegram !== undefined ? recibirTelegram : usuarioExistente.recibirTelegram,
        activo: activo !== undefined ? activo : usuarioExistente.activo
      }
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que el usuario existe
    const usuario = await db.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: { alertas: true }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar alertas y notificaciones asociadas primero
    await db.notificacion.deleteMany({
      where: { usuarioId: id }
    });

    await db.alerta.deleteMany({
      where: { usuarioId: id }
    });

    // Eliminar usuario
    await db.usuario.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
