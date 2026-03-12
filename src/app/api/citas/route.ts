import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Función para enviar notificación por Telegram
async function enviarNotificacionTelegram(mensaje: string) {
  try {
    const config = await db.configuracion.findFirst();
    
    if (!config?.telegramBotToken || !config?.telegramChatId || !config.notificacionesActivas) {
      console.log('Telegram no configurado o desactivado');
      return false;
    }
    
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: mensaje,
          parse_mode: 'Markdown'
        })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error enviando Telegram:', error);
    return false;
  }
}

// GET - Listar citas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    
    let where: any = {};
    
    if (fecha) {
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);
      
      where.fecha = {
        gte: inicioDia,
        lte: finDia
      };
    }
    
    const citas = await db.cita.findMany({
      where,
      include: { servicio: true },
      orderBy: { fecha: 'asc' }
    });
    
    return NextResponse.json(citas);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
  }
}

// POST - Crear cita (cliente)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, hora, clienteNombre, clienteTelefono, clienteEmail, servicioId, notas } = body;
    
    // Validar campos requeridos
    if (!fecha || !hora || !clienteNombre || !clienteTelefono || !servicioId) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos' 
      }, { status: 400 });
    }
    
    // Verificar que la hora no esté ocupada
    const fechaObj = new Date(fecha);
    const citaExistente = await db.cita.findFirst({
      where: {
        fecha: fechaObj,
        hora,
        estado: { not: 'cancelada' }
      }
    });
    
    if (citaExistente) {
      return NextResponse.json({ 
        error: 'Este horario ya está ocupado' 
      }, { status: 400 });
    }
    
    // Obtener info del servicio
    const servicio = await db.servicio.findUnique({
      where: { id: servicioId }
    });
    
    // Crear la cita
    const cita = await db.cita.create({
      data: {
        fecha: fechaObj,
        hora,
        clienteNombre,
        clienteTelefono,
        clienteEmail,
        servicioId,
        notas,
        estado: 'pendiente'
      },
      include: { servicio: true }
    });
    
    // Enviar notificación por Telegram al barbero
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const mensajeTelegram = `💈 *NUEVA CITA AGENDADA*

👤 *Cliente:* ${clienteNombre}
📱 *Teléfono:* ${clienteTelefono}
${clienteEmail ? `📧 *Email:* ${clienteEmail}` : ''}

✂️ *Servicio:* ${servicio?.nombre || 'N/A'}
💰 *Precio:* $${servicio?.precio || 0} USD

📅 *Fecha:* ${fechaFormateada}
🕐 *Hora:* ${hora}

${notas ? `📝 *Notas:* ${notas}` : ''}`;
    
    await enviarNotificacionTelegram(mensajeTelegram);
    
    return NextResponse.json({
      success: true,
      cita
    });
    
  } catch (error) {
    console.error('Error creando cita:', error);
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 });
  }
}

// PUT - Actualizar estado de cita (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, notas } = body;
    
    const cita = await db.cita.update({
      where: { id },
      data: { estado, notas }
    });
    
    return NextResponse.json(cita);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Cancelar cita
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await db.cita.update({
      where: { id },
      data: { estado: 'cancelada' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cancelar' }, { status: 500 });
  }
}
