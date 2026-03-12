import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Listar todos los recordatorios
export async function GET() {
  try {
    const recordatorios = await db.recordatorio.findMany({
      orderBy: { fechaRecordatorio: 'asc' },
      include: {
        envios: {
          orderBy: { enviadoAt: 'desc' },
          take: 10
        }
      }
    });
    return NextResponse.json(recordatorios);
  } catch (error) {
    console.error('Error listando recordatorios:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Crear nuevo recordatorio
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const recordatorio = await db.recordatorio.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        fechaRecordatorio: new Date(data.fechaRecordatorio),
        asunto: data.asunto,
        mensaje: data.mensaje,
        telegramId: data.telegramId || null,
        numeroTelefono: data.numeroTelefono || null,
        enviarEmail: data.enviarEmail ?? true,
        enviarTelegram: data.enviarTelegram ?? false,
        enviarSMS: data.enviarSMS ?? false,
        repetir: data.repetir ?? false,
        frecuencia: data.frecuencia || null,
      }
    });

    return NextResponse.json(recordatorio);
  } catch (error) {
    console.error('Error creando recordatorio:', error);
    return NextResponse.json({ error: 'Error al crear recordatorio' }, { status: 500 });
  }
}
