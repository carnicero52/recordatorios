import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// ========== ENVÍO DE EMAIL ==========
async function enviarEmail(to: string, asunto: string, mensaje: string, config: any) {
  console.log('📧 Intentando enviar email...');
  console.log('   - Configurado:', config.gmailEmail);
  console.log('   - Password length:', config.gmailPassword?.length || 0);
  console.log('   - Activo:', config.gmailActivo);

  if (!config.gmailActivo) {
    return { success: false, error: 'Gmail está desactivado. Activa Gmail en Configuración.' };
  }
  if (!config.gmailEmail) {
    return { success: false, error: 'No hay correo Gmail configurado.' };
  }
  if (!config.gmailPassword) {
    return { success: false, error: 'No hay contraseña de aplicación configurada.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.gmailEmail, pass: config.gmailPassword }
    });

    // Verificar conexión antes de enviar
    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

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
    console.error('❌ Error enviando email:', error);
    
    // Errores comunes de Gmail
    let errorMsg = error.message;
    if (error.code === 'EAUTH') {
      errorMsg = '❌ Autenticación fallida. La contraseña de aplicación NO es válida para este correo. Verifica que sea una contraseña de aplicación de 16 caracteres generada en myaccount.google.com/apppasswords';
    } else if (error.code === 'ECONNECTION') {
      errorMsg = '❌ No se pudo conectar a Gmail. Verifica tu conexión a internet.';
    } else if (error.responseCode === 535) {
      errorMsg = '❌ Credenciales incorrectas. Asegúrate de usar una CONTRASEÑA DE APLICACIÓN, no tu contraseña normal de Gmail.';
    }
    
    return { success: false, error: errorMsg, code: error.code };
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
      body: JSON.stringify({ chat_id: chatId, text: `🔔 *Recordatorio*\n\n${mensaje}`, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    return data.ok ? { success: true } : { success: false, error: data.description || 'Error' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== ENVÍO DE WHATSAPP (CallMeBot) - GRATIS ==========
async function enviarWhatsApp(mensaje: string, config: any) {
  if (!config.callmebotActivo || !config.callmebotApiKey || !config.callmebotPhone) {
    return { success: false, error: 'WhatsApp no configurado o inactivo' };
  }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?` +
      `phone=${config.callmebotPhone}&` +
      `text=${encodeURIComponent(`🔔 *Recordatorio*\n\n${mensaje}`)}&` +
      `apikey=${config.callmebotApiKey}`;
    
    const res = await fetch(url);
    const text = await res.text();
    
    if (!res.ok || text.includes('error')) {
      return { success: false, error: text || 'Error al enviar WhatsApp' };
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
    const { tipo, testEmail, testTelegram, recordatorioId } = body;
    const config = await db.configuracion.findFirst();

    if (!config) return NextResponse.json({ error: 'Sin configuración' }, { status: 400 });

    // Test Email
    if (tipo === 'testEmail' && testEmail) {
      console.log('📧 Probando email a:', testEmail);
      const result = await enviarEmail(testEmail, 'Prueba - Sistema de Recordatorios', 'Si recibes este mensaje, Gmail está configurado correctamente.', config);
      console.log('📤 Resultado:', result);
      return NextResponse.json(result);
    }

    // Test Telegram
    if (tipo === 'testTelegram' && testTelegram) {
      console.log('📱 Probando Telegram a:', testTelegram);
      const result = await enviarTelegram(testTelegram, 'Prueba de Telegram\n\nSi ves este mensaje, Telegram funciona correctamente.', config);
      console.log('📤 Resultado:', result);
      return NextResponse.json(result);
    }

    // Test WhatsApp
    if (tipo === 'testWhatsApp') {
      console.log('📱 Probando WhatsApp...');
      const result = await enviarWhatsApp('Prueba de WhatsApp\n\nSi ves este mensaje, WhatsApp funciona correctamente!', config);
      console.log('📤 Resultado:', result);
      return NextResponse.json(result);
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
