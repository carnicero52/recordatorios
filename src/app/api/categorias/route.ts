import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar categorías
export async function GET() {
  try {
    const categorias = await db.categoria.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
      include: {
        _count: {
          select: { alertas: true }
        }
      }
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, color, icono } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existente = await db.categoria.findUnique({
      where: { nombre }
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    // Obtener el máximo orden
    const maxOrden = await db.categoria.aggregate({
      _max: { orden: true }
    });

    const categoria = await db.categoria.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        color: color || '#f59e0b',
        icono: icono || 'bell',
        orden: (maxOrden._max.orden || 0) + 1
      }
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error('Error creando categoría:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
