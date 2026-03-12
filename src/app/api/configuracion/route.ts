import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener configuración
export async function GET() {
  try {
    let config = await db.configuracion.findFirst();

    // Si no existe, crear configuración por defecto
    if (!config) {
      config = await db.configuracion.create({
        data: {
          nombreNegocio: 'Sistema de Alertas',
          diasAnticipacion: 3,
          enviarRecordatorios: true
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar configuración
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    let config = await db.configuracion.findFirst();

    if (!config) {
      config = await db.configuracion.create({
        data: {
          nombreNegocio: body.nombreNegocio || 'Sistema de Alertas',
          emailRemitente: body.emailRemitente,
          emailPassword: body.emailPassword,
          emailActivo: body.emailActivo ?? false,
          telegramBotToken: body.telegramBotToken,
          telegramChatId: body.telegramChatId,
          telegramActivo: body.telegramActivo ?? false,
          diasAnticipacion: body.diasAnticipacion ?? 3,
          enviarRecordatorios: body.enviarRecordatorios ?? true
        }
      });
    } else {
      config = await db.configuracion.update({
        where: { id: config.id },
        data: {
          nombreNegocio: body.nombreNegocio,
          logoUrl: body.logoUrl,
          emailRemitente: body.emailRemitente,
          emailPassword: body.emailPassword,
          emailActivo: body.emailActivo,
          telegramBotToken: body.telegramBotToken,
          telegramChatId: body.telegramChatId,
          telegramActivo: body.telegramActivo,
          diasAnticipacion: body.diasAnticipacion,
          enviarRecordatorios: body.enviarRecordatorios
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
