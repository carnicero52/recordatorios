import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Actualizar servicio parcialmente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.precio) body.precio = parseFloat(body.precio);
    if (body.duracion) body.duracion = parseInt(body.duracion);
    if (body.orden) body.orden = parseInt(body.orden);
    
    const servicio = await db.servicio.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json(servicio);
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Eliminar servicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.servicio.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

// GET - Obtener un servicio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const servicio = await db.servicio.findUnique({
      where: { id }
    });
    
    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(servicio);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener servicio' }, { status: 500 });
  }
}
