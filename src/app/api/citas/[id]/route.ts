import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Actualizar cita parcialmente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const cita = await db.cita.update({
      where: { id },
      data: body,
      include: { servicio: true }
    });
    
    return NextResponse.json(cita);
  } catch (error) {
    console.error('Error actualizando cita:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Eliminar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.cita.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cita:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

// GET - Obtener una cita
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const cita = await db.cita.findUnique({
      where: { id },
      include: { servicio: true }
    });
    
    if (!cita) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(cita);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cita' }, { status: 500 });
  }
}
