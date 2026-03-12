import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Obtener configuración
export async function GET() {
  try {
    let config = await db.configuracion.findFirst();

    if (!config) {
      config = await db.configuracion.create({
        data: {
          nombreSistema: 'Sistema de Recordatorios Multicanal',
          horaEjecucion: '09:00',
        }
      });
    }

    // Devolver configuración con indicadores de qué ya está guardado
    return NextResponse.json({
      id: config.id,
      nombreSistema: config.nombreSistema,
      horaEjecucion: config.horaEjecucion,

      // Gmail
      gmailEmail: config.gmailEmail || '',
      gmailActivo: config.gmailActivo,
      gmailConfigurado: !!config.gmailPassword,

      // Telegram
      telegramActivo: config.telegramActivo,
      telegramConfigurado: !!config.telegramBotToken,

      // SMS/Twilio
      twilioAccountSid: config.twilioAccountSid || '',
      twilioPhoneNumber: config.twilioPhoneNumber || '',
      smsActivo: config.smsActivo,
      twilioConfigurado: !!config.twilioAuthToken,
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Actualizar configuración
export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    let config = await db.configuracion.findFirst();

    // Preparar datos básicos que siempre se actualizan
    const updateData: any = {
      nombreSistema: data.nombreSistema,
      horaEjecucion: data.horaEjecucion,
      gmailEmail: data.gmailEmail,
      gmailActivo: data.gmailActivo,
      telegramActivo: data.telegramActivo,
      twilioAccountSid: data.twilioAccountSid,
      twilioPhoneNumber: data.twilioPhoneNumber,
      smsActivo: data.smsActivo,
    };

    // Solo actualizar contraseñas/tokens si vienen con valor real (no vacío)
    if (data.gmailPassword && data.gmailPassword.trim().length > 0) {
      updateData.gmailPassword = data.gmailPassword.trim();
    }
    if (data.telegramBotToken && data.telegramBotToken.trim().length > 0) {
      updateData.telegramBotToken = data.telegramBotToken.trim();
    }
    if (data.twilioAuthToken && data.twilioAuthToken.trim().length > 0) {
      updateData.twilioAuthToken = data.twilioAuthToken.trim();
    }

    if (!config) {
      config = await db.configuracion.create({ data: updateData });
    } else {
      config = await db.configuracion.update({
        where: { id: config.id },
        data: updateData
      });
    }

    return NextResponse.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
