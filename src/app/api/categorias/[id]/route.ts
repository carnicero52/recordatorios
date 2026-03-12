import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Actualizar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, color, icono, orden } = body;

    // Verificar que la categoría existe
    const categoriaExistente = await db.categoria.findUnique({
      where: { id }
    });

    if (!categoriaExistente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre, verificar que no exista
    if (nombre && nombre !== categoriaExistente.nombre) {
      const nombreExistente = await db.categoria.findUnique({
        where: { nombre }
      });
      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre' },
          { status: 400 }
        );
      }
    }

    const categoria = await db.categoria.update({
      where: { id },
      data: {
        nombre: nombre || categoriaExistente.nombre,
        descripcion: descripcion !== undefined ? descripcion : categoriaExistente.descripcion,
        color: color || categoriaExistente.color,
        icono: icono || categoriaExistente.icono,
        orden: orden !== undefined ? orden : categoriaExistente.orden
      }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la categoría existe
    const categoria = await db.categoria.findUnique({
      where: { id }
    });

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete
    await db.categoria.update({
      where: { id },
      data: { activo: false }
    });

    return NextResponse.json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
