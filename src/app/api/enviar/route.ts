import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enviarEmail } from '@/lib/email';
import { enviarTelegram } from '@/lib/telegram';

// POST - Enviar alertas pendientes programadas
export async function POST(request: NextRequest) {
  try {
    const config = await db.configuracion.findFirst();
    
    if (!config || !config.enviarRecordatorios) {
      return NextResponse.json({
        message: 'Los recordatorios están desactivados'
      });
    }

    const hoy = new Date();
    const diasAnticipacion = config.diasAnticipacion || 3;
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    // Buscar alertas pendientes que vencen pronto
    const alertasPendientes = await db.alerta.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: {
          lte: fechaLimite,
          gte: hoy
        }
      },
      include: {
        usuario: true,
        categoria: true
      }
    });

    const resultados = [];

    for (const alerta of alertasPendientes) {
      const mensaje = construirMensaje(alerta, config);
      const asunto = `Recordatorio: ${alerta.titulo}`;

      // Enviar por email si está activo y el usuario lo permite
      if (config.emailActivo && alerta.usuario.recibirEmail && alerta.usuario.email) {
        const notificacion = await db.notificacion.create({
          data: {
            canal: 'email',
            destinatario: alerta.usuario.email,
            asunto,
            mensaje,
            alertaId: alerta.id,
            usuarioId: alerta.usuarioId,
            estado: 'enviando'
          }
        });

        try {
          const exitoso = await enviarEmail({
            to: alerta.usuario.email,
            subject: asunto,
            text: mensaje
          });

          await db.notificacion.update({
            where: { id: notificacion.id },
            data: { estado: exitoso ? 'enviado' : 'error' }
          });

          resultados.push({
            alertaId: alerta.id,
            canal: 'email',
            exitoso
          });
        } catch (error: any) {
          await db.notificacion.update({
            where: { id: notificacion.id },
            data: { estado: 'error', error: error.message }
          });
        }
      }

      // Enviar por Telegram si está activo y el usuario lo permite
      if (config.telegramActivo && alerta.usuario.recibirTelegram && alerta.usuario.telegramId) {
        const notificacion = await db.notificacion.create({
          data: {
            canal: 'telegram',
            destinatario: alerta.usuario.telegramId,
            mensaje,
            alertaId: alerta.id,
            usuarioId: alerta.usuarioId,
            estado: 'enviando'
          }
        });

        try {
          const exitoso = await enviarTelegram(alerta.usuario.telegramId, mensaje);

          await db.notificacion.update({
            where: { id: notificacion.id },
            data: { estado: exitoso ? 'enviado' : 'error' }
          });

          resultados.push({
            alertaId: alerta.id,
            canal: 'telegram',
            exitoso
          });
        } catch (error: any) {
          await db.notificacion.update({
            where: { id: notificacion.id },
            data: { estado: 'error', error: error.message }
          });
        }
      }

      // Marcar alerta como enviada
      await db.alerta.update({
        where: { id: alerta.id },
        data: { estado: 'enviado' }
      });
    }

    return NextResponse.json({
      totalProcesadas: alertasPendientes.length,
      resultados
    });
  } catch (error) {
    console.error('Error enviando alertas:', error);
    return NextResponse.json(
      { error: 'Error al enviar alertas' },
      { status: 500 }
    );
  }
}

function construirMensaje(alerta: any, config: any): string {
  let mensaje = `📌 *${alerta.titulo}*\n\n`;
  
  if (alerta.descripcion) {
    mensaje += `${alerta.descripcion}\n\n`;
  }

  if (alerta.monto) {
    mensaje += `💰 Monto: $${alerta.monto.toFixed(2)}\n`;
  }

  if (alerta.fechaVencimiento) {
    const fecha = new Date(alerta.fechaVencimiento).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    mensaje += `📅 Vencimiento: ${fecha}\n`;
  }

  if (alerta.categoria) {
    mensaje += `🏷️ Categoría: ${alerta.categoria.nombre}\n`;
  }

  mensaje += `\n---\n${config.nombreNegocio}`;

  return mensaje;
}
