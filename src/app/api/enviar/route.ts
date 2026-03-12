import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// ========== ENVÍO DE EMAIL (Gmail SMTP) ==========
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

// ========== ENVÍO DE SMS (Twilio) ==========
async function enviarSMS(telefono: string, mensaje: string, config: any): Promise<{ success: boolean; error?: string }> {
  if (!config.smsActivo || !config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return { success: false, error: 'SMS/Twilio no configurado o inactivo' };
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

// ========== ENDPOINT ==========
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, recordatorioId, testEmail, testTelegram, testSMS } = body;

    const config = await db.configuracion.findFirst();
    if (!config) return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 400 });

    // Prueba Email
    if (tipo === 'testEmail' && testEmail) {
      const result = await enviarEmail(testEmail, 'Prueba de Email', 'Esta es una prueba del sistema de recordatorios.', config);
      return NextResponse.json(result);
    }

    // Prueba Telegram
    if (tipo === 'testTelegram' && testTelegram) {
      const result = await enviarTelegram(testTelegram, 'Prueba de Telegram - Sistema de Recordatorios', config);
      return NextResponse.json(result);
    }

    // Prueba SMS
    if (tipo === 'testSMS' && testSMS) {
      const result = await enviarSMS(testSMS, 'Prueba de SMS - Sistema de Recordatorios', config);
      return NextResponse.json(result);
    }

    // Enviar un recordatorio específico
    if (tipo === 'enviar' && recordatorioId) {
      const recordatorio = await db.recordatorio.findUnique({ where: { id: recordatorioId } });
      if (!recordatorio) return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });

      const resultados: any = {};

      if (recordatorio.enviarEmail && recordatorio.correo) {
        const result = await enviarEmail(recordatorio.correo, recordatorio.asunto, recordatorio.mensaje, config);
        resultados.email = result;
        await db.envio.create({
          data: { recordatorioId: recordatorio.id, canal: 'email', destinatario: recordatorio.correo, estado: result.success ? 'enviado' : 'error', error: result.error }
        });
      }

      if (recordatorio.enviarTelegram && recordatorio.telegramId) {
        const result = await enviarTelegram(recordatorio.telegramId, `${recordatorio.asunto}\n\n${recordatorio.mensaje}`, config);
        resultados.telegram = result;
        await db.envio.create({
          data: { recordatorioId: recordatorio.id, canal: 'telegram', destinatario: recordatorio.telegramId, estado: result.success ? 'enviado' : 'error', error: result.error }
        });
      }

      if (recordatorio.enviarSMS && recordatorio.numeroTelefono) {
        const result = await enviarSMS(recordatorio.numeroTelefono, `${recordatorio.asunto}: ${recordatorio.mensaje}`, config);
        resultados.sms = result;
        await db.envio.create({
          data: { recordatorioId: recordatorio.id, canal: 'sms', destinatario: recordatorio.numeroTelefono, estado: result.success ? 'enviado' : 'error', error: result.error }
        });
      }

      const algunExito = Object.values(resultados).some((r: any) => r?.success);
      await db.recordatorio.update({
        where: { id: recordatorioId },
        data: { estado: algunExito ? 'enviado' : 'error', ultimoIntento: new Date() }
      });

      return NextResponse.json({ success: true, resultados });
    }

    // Ejecución diaria
    if (tipo === 'ejecutarDiario') {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

      const pendientes = await db.recordatorio.findMany({
        where: { fechaRecordatorio: { gte: inicio, lte: fin }, estado: 'pendiente' }
      });

      console.log(`📅 Encontrados ${pendientes.length} recordatorios para hoy`);

      for (const r of pendientes) {
        if (r.enviarEmail && r.correo) {
          const result = await enviarEmail(r.correo, r.asunto, r.mensaje, config);
          await db.envio.create({ data: { recordatorioId: r.id, canal: 'email', destinatario: r.correo, estado: result.success ? 'enviado' : 'error', error: result.error } });
        }
        if (r.enviarTelegram && r.telegramId) {
          const result = await enviarTelegram(r.telegramId, `${r.asunto}\n\n${r.mensaje}`, config);
          await db.envio.create({ data: { recordatorioId: r.id, canal: 'telegram', destinatario: r.telegramId, estado: result.success ? 'enviado' : 'error', error: result.error } });
        }
        if (r.enviarSMS && r.numeroTelefono) {
          const result = await enviarSMS(r.numeroTelefono, `${r.asunto}: ${r.mensaje}`, config);
          await db.envio.create({ data: { recordatorioId: r.id, canal: 'sms', destinatario: r.numeroTelefono, estado: result.success ? 'enviado' : 'error', error: result.error } });
        }
        await db.recordatorio.update({ where: { id: r.id }, data: { estado: 'enviado', ultimoIntento: new Date() } });
      }

      return NextResponse.json({ success: true, procesados: pendientes.length });
    }

    return NextResponse.json({ error: 'Tipo de operación no válido' }, { status: 400 });
  } catch (error) {
    console.error('Error en envío:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
