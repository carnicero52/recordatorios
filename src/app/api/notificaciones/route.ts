import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enviarEmail } from '@/lib/email';
import { enviarTelegram } from '@/lib/telegram';

// POST - Enviar notificación manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertaId, canal, destinatario, asunto, mensaje } = body;

    if (!alertaId || !canal || !mensaje) {
      return NextResponse.json(
        { error: 'Alerta ID, canal y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Obtener la alerta
    const alerta = await db.alerta.findUnique({
      where: { id: alertaId },
      include: {
        usuario: true
      }
    });

    if (!alerta) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    const destinatarioFinal = destinatario || 
      (canal === 'email' ? alerta.usuario.email : alerta.usuario.telegramId);

    if (!destinatarioFinal) {
      return NextResponse.json(
        { error: 'No hay destinatario disponible para este canal' },
        { status: 400 }
      );
    }

    // Crear registro de notificación
    const notificacion = await db.notificacion.create({
      data: {
        canal,
        destinatario: destinatarioFinal,
        asunto: asunto || alerta.titulo,
        mensaje,
        alertaId,
        usuarioId: alerta.usuarioId,
        estado: 'enviando'
      }
    });

    let envioExitoso = false;
    let errorMessage = '';

    try {
      if (canal === 'email') {
        envioExitoso = await enviarEmail({
          to: destinatarioFinal,
          subject: asunto || alerta.titulo,
          text: mensaje
        });
      } else if (canal === 'telegram') {
        envioExitoso = await enviarTelegram(destinatarioFinal, mensaje);
      }

      if (envioExitoso) {
        await db.notificacion.update({
          where: { id: notificacion.id },
          data: { estado: 'enviado' }
        });

        // Actualizar estado de la alerta
        await db.alerta.update({
          where: { id: alertaId },
          data: { estado: 'enviado' }
        });
      } else {
        errorMessage = 'Error al enviar notificación';
        await db.notificacion.update({
          where: { id: notificacion.id },
          data: { estado: 'error', error: errorMessage }
        });
      }
    } catch (error: any) {
      errorMessage = error.message || 'Error desconocido';
      await db.notificacion.update({
        where: { id: notificacion.id },
        data: { estado: 'error', error: errorMessage }
      });
    }

    return NextResponse.json({
      success: envioExitoso,
      notificacion: await db.notificacion.findUnique({
        where: { id: notificacion.id }
      }),
      error: envioExitoso ? null : errorMessage
    });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificación' },
      { status: 500 }
    );
  }
}
