import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// ========== ENVÍO DE EMAIL ==========
async function enviarEmail(to: string, asunto: string, mensaje: string, config: any) {
  if (!config.gmailActivo || !config.gmailEmail || !config.gmailPassword) {
    return { success: false, error: 'Gmail no configurado o inactivo' };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.gmailEmail, pass: config.gmailPassword }
    });
    await transporter.sendMail({
      from: config.gmailEmail,
      to,
      subject: asunto,
      text: mensaje,
      html: `<div style="font-family:Arial;padding:20px;max-width:600px">
        <h2 style="color:#f59e0b">${asunto}</h2>
        <div style="white-space:pre-wrap;line-height:1.6">${mensaje}</div>
        <hr style="margin:30px 0;border:none;border-top:1px solid #eee">
        <p style="color:#888;font-size:12px">Sistema de Recordatorios</p>
      </div>`
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENVÍO DE TELEGRAM ==========
async function enviarTelegram(chatId: string, mensaje: string, config: any) {
  if (!config.telegramActivo || !config.telegramBotToken) {
    return { success: false, error: 'Telegram no configurado o inactivo' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔔 *Recordatorio*\n\n${mensaje}`,
        parse_mode: 'Markdown'
      })
    });
    const data = await res.json();
    return data.ok ? { success: true } : { success: false, error: data.description || 'Error' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENDPOINT ==========
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, testEmail, testTelegram, recordatorioId } = body;
    const config = await db.configuracion.findFirst();

    if (!config) return NextResponse.json({ error: 'Sin configuración' }, { status: 400 });

    // Test Email
    if (tipo === 'testEmail' && testEmail) {
      return NextResponse.json(await enviarEmail(testEmail, 'Prueba - Recordatorios', 'Esta es una prueba del sistema.', config));
    }

    // Test Telegram
    if (tipo === 'testTelegram' && testTelegram) {
      return NextResponse.json(await enviarTelegram(testTelegram, 'Prueba de Telegram\n\nSi ves esto, Telegram funciona correctamente.', config));
    }

    // Enviar recordatorio específico
    if (tipo === 'enviar' && recordatorioId) {
      const r = await db.recordatorio.findUnique({ where: { id: recordatorioId } });
      if (!r) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      const resultados: any = {};

      if (r.enviarEmail && r.correo) {
        const res = await enviarEmail(r.correo, r.asunto, r.mensaje, config);
        resultados.email = res;
        await db.envio.create({ data: { recordatorioId: r.id, canal: 'email', destinatario: r.correo, estado: res.success ? 'enviado' : 'error', error: res.error } });
      }

      if (r.enviarTelegram && r.telegramId) {
        const res = await enviarTelegram(r.telegramId, `${r.asunto}\n\n${r.mensaje}`, config);
        resultados.telegram = res;
        await db.envio.create({ data: { recordatorioId: r.id, canal: 'telegram', destinatario: r.telegramId, estado: res.success ? 'enviado' : 'error', error: res.error } });
      }

      const exito = Object.values(resultados).some((x: any) => x?.success);
      await db.recordatorio.update({ where: { id: r.id }, data: { estado: exito ? 'enviado' : 'error', ultimoIntento: new Date() } });
      return NextResponse.json({ success: true, resultados });
    }

    // Ejecutar diario
    if (tipo === 'ejecutarDiario') {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
      const pendientes = await db.recordatorio.findMany({ where: { fechaRecordatorio: { gte: inicio, lte: fin }, estado: 'pendiente' } });

      for (const r of pendientes) {
        if (r.enviarEmail && r.correo) {
          const res = await enviarEmail(r.correo, r.asunto, r.mensaje, config);
          await db.envio.create({ data: { recordatorioId: r.id, canal: 'email', destinatario: r.correo, estado: res.success ? 'enviado' : 'error', error: res.error } });
        }
        if (r.enviarTelegram && r.telegramId) {
          const res = await enviarTelegram(r.telegramId, `${r.asunto}\n\n${r.mensaje}`, config);
          await db.envio.create({ data: { recordatorioId: r.id, canal: 'telegram', destinatario: r.telegramId, estado: res.success ? 'enviado' : 'error', error: res.error } });
        }
        await db.recordatorio.update({ where: { id: r.id }, data: { estado: 'enviado', ultimoIntento: new Date() } });
      }
      return NextResponse.json({ success: true, procesados: pendientes.length });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
