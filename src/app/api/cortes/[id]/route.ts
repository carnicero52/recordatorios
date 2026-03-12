import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Actualizar corte parcialmente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.orden) body.orden = parseInt(body.orden);
    
    const corte = await db.corte.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json(corte);
  } catch (error) {
    console.error('Error actualizando corte:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Eliminar corte
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.corte.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando corte:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

// GET - Obtener un corte
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const corte = await db.corte.findUnique({
      where: { id }
    });
    
    if (!corte) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(corte);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener corte' }, { status: 500 });
  }
}
