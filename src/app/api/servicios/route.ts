import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar servicios activos
export async function GET() {
  try {
    const servicios = await db.servicio.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' }
    });
    return NextResponse.json(servicios);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}

// POST - Crear servicio (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, precio, duracion, descripcion, imagenUrl, orden } = body;
    
    const servicio = await db.servicio.create({
      data: {
        nombre,
        precio: parseFloat(precio),
        duracion: parseInt(duracion) || 30,
        descripcion,
        imagenUrl,
        orden: parseInt(orden) || 0
      }
    });
    
    return NextResponse.json(servicio);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}

// PUT - Actualizar servicio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (data.precio) data.precio = parseFloat(data.precio);
    if (data.duracion) data.duracion = parseInt(data.duracion);
    if (data.orden) data.orden = parseInt(data.orden);
    
    const servicio = await db.servicio.update({
      where: { id },
      data
    });
    
    return NextResponse.json(servicio);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Desactivar servicio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await db.servicio.update({
      where: { id },
      data: { activo: false }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
