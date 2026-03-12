import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar cortes/galería
export async function GET() {
  try {
    const cortes = await db.corte.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' }
    });
    return NextResponse.json(cortes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cortes' }, { status: 500 });
  }
}

// POST - Crear corte (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, imagenUrl, orden } = body;
    
    const corte = await db.corte.create({
      data: {
        titulo,
        descripcion,
        imagenUrl,
        orden: parseInt(orden) || 0
      }
    });
    
    return NextResponse.json(corte);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear corte' }, { status: 500 });
  }
}

// PUT - Actualizar corte
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (data.orden) data.orden = parseInt(data.orden);
    
    const corte = await db.corte.update({
      where: { id },
      data
    });
    
    return NextResponse.json(corte);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Desactivar corte
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await db.corte.update({
      where: { id },
      data: { activo: false }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
