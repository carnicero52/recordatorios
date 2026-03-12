import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Obtener un recordatorio específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordatorio = await db.recordatorio.findUnique({
      where: { id },
      include: { envios: true }
    });

    if (!recordatorio) {
      return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(recordatorio);
  } catch (error) {
    console.error('Error obteniendo recordatorio:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Actualizar un recordatorio
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const recordatorio = await db.recordatorio.update({
      where: { id },
      data: {
        nombre: data.nombre,
        correo: data.correo,
        fechaRecordatorio: new Date(data.fechaRecordatorio),
        asunto: data.asunto,
        mensaje: data.mensaje,
        telegramId: data.telegramId || null,
        numeroTelefono: data.numeroTelefono || null,
        enviarEmail: data.enviarEmail,
        enviarTelegram: data.enviarTelegram,
        enviarSMS: data.enviarSMS,
      }
    });

    return NextResponse.json(recordatorio);
  } catch (error) {
    console.error('Error actualizando recordatorio:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// Eliminar un recordatorio
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.recordatorio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando recordatorio:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
