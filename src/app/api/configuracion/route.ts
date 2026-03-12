import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Obtener configuración
export async function GET() {
  try {
    let config = await db.configuracion.findFirst();

    if (!config) {
      config = await db.configuracion.create({
        data: { nombreSistema: 'Sistema de Recordatorios Multicanal' }
      });
    }

    return NextResponse.json({
      id: config.id,
      nombreSistema: config.nombreSistema,
      horaEjecucion: config.horaEjecucion,

      // Gmail
      gmailEmail: config.gmailEmail || '',
      gmailActivo: config.gmailActivo,
      gmailConfigurado: !!(config.gmailEmail && config.gmailPassword),

      // Telegram
      telegramActivo: config.telegramActivo,
      telegramConfigurado: !!config.telegramBotToken,

      // SMS
      smsActivo: config.smsActivo,
      smsConfigurado: !!(config.twilioAccountSid && config.twilioAuthToken),
      twilioPhoneNumber: config.twilioPhoneNumber || '',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Actualizar configuración
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    let config = await db.configuracion.findFirst();

    const updateData: any = {
      nombreSistema: data.nombreSistema,
      horaEjecucion: data.horaEjecucion,
      gmailEmail: data.gmailEmail,
      gmailActivo: data.gmailActivo,
      telegramActivo: data.telegramActivo,
      smsActivo: data.smsActivo,
      twilioPhoneNumber: data.twilioPhoneNumber,
    };

    // Solo actualizar contraseñas si vienen con valor
    if (data.gmailPassword?.trim()) updateData.gmailPassword = data.gmailPassword.trim();
    if (data.telegramBotToken?.trim()) updateData.telegramBotToken = data.telegramBotToken.trim();
    if (data.twilioAccountSid) updateData.twilioAccountSid = data.twilioAccountSid;
    if (data.twilioAuthToken?.trim()) updateData.twilioAuthToken = data.twilioAuthToken.trim();

    if (!config) {
      config = await db.configuracion.create({ data: updateData });
    } else {
      config = await db.configuracion.update({ where: { id: config.id }, data: updateData });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
