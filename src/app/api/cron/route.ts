import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// Verificar secret para autorizar ejecución
const CRON_SECRET = process.env.CRON_SECRET || 'recordatorios-cron-2024';

// ========== ENVÍO DE EMAIL ==========
async function enviarEmail(to: string, asunto: string, mensaje: string, config: any): Promise<{ success: boolean; error?: string }> {
  if (!config.gmailActivo || !config.gmailEmail || !config.gmailPassword) {
    return { success: false, error: 'Gmail no configurado o inactivo' };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.gmailEmail, pass: config.gmailPassword },
    });
    await transporter.sendMail({
      from: config.gmailEmail,
      to,
      subject: asunto,
      text: mensaje,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f59e0b;">${asunto}</h2>
        <p style="white-space: pre-wrap;">${mensaje}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">Sistema de Recordatorios Multicanal</p>
      </div>`,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENVÍO DE TELEGRAM ==========
async function enviarTelegram(telegramId: string, mensaje: string, config: any): Promise<{ success: boolean; error?: string }> {
  if (!config.telegramActivo || !config.telegramBotToken) {
    return { success: false, error: 'Telegram no configurado o inactivo' };
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: `🔔 *Recordatorio*\n\n${mensaje}`,
        parse_mode: 'Markdown',
      }),
    });
    const data = await response.json();
    if (!data.ok) return { success: false, error: data.description || 'Error de Telegram' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENVÍO DE SMS ==========
async function enviarSMS(telefono: string, mensaje: string, config: any): Promise<{ success: boolean; error?: string }> {
  if (!config.smsActivo || !config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return { success: false, error: 'SMS no configurado o inactivo' };
  }
  try {
    const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: config.twilioPhoneNumber, To: telefono, Body: `Recordatorio: ${mensaje}` }),
      }
    );
    const data = await response.json();
    if (data.status === 'failed' || data.status === 'undelivered') {
      return { success: false, error: data.error_message || 'Error al enviar SMS' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENVÍO DE WHATSAPP (CallMeBot) - GRATIS ==========
async function enviarWhatsApp(mensaje: string, config: any): Promise<{ success: boolean; error?: string }> {
  if (!config.callmebotActivo || !config.callmebotApiKey || !config.callmebotPhone) {
    return { success: false, error: 'WhatsApp no configurado o inactivo' };
  }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?` +
      `phone=${config.callmebotPhone}&` +
      `text=${encodeURIComponent(`🔔 *Recordatorio*\n\n${mensaje}`)}&` +
      `apikey=${config.callmebotApiKey}`;
    
    const response = await fetch(url);
    const text = await response.text();
    
    if (!response.ok || text.includes('error')) {
      return { success: false, error: text || 'Error al enviar WhatsApp' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENDPOINT CRON ==========
export async function GET(request: Request) {
  try {
    // Verificar autorización
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔄 Ejecutando cron de recordatorios...');

    const config = await db.configuracion.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Sin configuración' }, { status: 400 });
    }

    // Buscar recordatorios para la HORA EXACTA (ventana de 2 minutos)
    const ahora = new Date();
    const haceUnMinuto = new Date(ahora.getTime() - 60 * 1000);
    const enUnMinuto = new Date(ahora.getTime() + 60 * 1000);

    console.log(`🕐 Verificando recordatorios entre ${haceUnMinuto.toISOString()} y ${enUnMinuto.toISOString()}`);

    const recordatoriosAhora = await db.recordatorio.findMany({
      where: {
        fechaRecordatorio: {
          gte: haceUnMinuto,
          lte: enUnMinuto
        },
        estado: 'pendiente'
      }
    });

    console.log(`📅 Encontrados ${recordatoriosAhora.length} recordatorios para enviar ahora`);

    const resultados = [];

    for (const r of recordatoriosAhora) {
      let enviado = false;
      const errores: string[] = [];

      // Enviar Email
      if (r.enviarEmail && r.correo && config.gmailActivo) {
        const result = await enviarEmail(r.correo, r.asunto, r.mensaje, config);
        if (result.success) {
          enviado = true;
        } else {
          errores.push(`Email: ${result.error}`);
        }
        await db.envio.create({
          data: {
            recordatorioId: r.id,
            canal: 'email',
            destinatario: r.correo,
            estado: result.success ? 'enviado' : 'error',
            error: result.error
          }
        });
      }

      // Enviar Telegram
      if (r.enviarTelegram && r.telegramId && config.telegramActivo) {
        const result = await enviarTelegram(r.telegramId, `${r.asunto}\n\n${r.mensaje}`, config);
        if (result.success) {
          enviado = true;
        } else {
          errores.push(`Telegram: ${result.error}`);
        }
        await db.envio.create({
          data: {
            recordatorioId: r.id,
            canal: 'telegram',
            destinatario: r.telegramId,
            estado: result.success ? 'enviado' : 'error',
            error: result.error
          }
        });
      }

      // Enviar SMS
      if (r.enviarSMS && r.numeroTelefono && config.smsActivo) {
        const result = await enviarSMS(r.numeroTelefono, `${r.asunto}: ${r.mensaje}`, config);
        if (result.success) {
          enviado = true;
        } else {
          errores.push(`SMS: ${result.error}`);
        }
        await db.envio.create({
          data: {
            recordatorioId: r.id,
            canal: 'sms',
            destinatario: r.numeroTelefono,
            estado: result.success ? 'enviado' : 'error',
            error: result.error
          }
        });
      }

      // Enviar WhatsApp (CallMeBot) - GRATIS
      if (r.enviarWhatsApp && config.callmebotActivo) {
        const result = await enviarWhatsApp(`${r.asunto}\n\n${r.mensaje}`, config);
        if (result.success) {
          enviado = true;
        } else {
          errores.push(`WhatsApp: ${result.error}`);
        }
        await db.envio.create({
          data: {
            recordatorioId: r.id,
            canal: 'whatsapp',
            destinatario: config.callmebotPhone,
            estado: result.success ? 'enviado' : 'error',
            error: result.error
          }
        });
      }

      // Actualizar estado del recordatorio
      await db.recordatorio.update({
        where: { id: r.id },
        data: {
          estado: enviado ? 'enviado' : 'error',
          ultimoIntento: new Date(),
          errorMensaje: errores.length > 0 ? errores.join(' | ') : null
        }
      });

      resultados.push({
        id: r.id,
        nombre: r.nombre,
        enviado,
        errores
      });
    }

    return NextResponse.json({
      success: true,
      fecha: ahora.toISOString(),
      procesados: recordatoriosAhora.length,
      resultados
    });

  } catch (error) {
    console.error('Error en cron:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
