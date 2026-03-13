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
    console.error('Error GET config:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Actualizar configuración
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    console.log('='.repeat(50));
    console.log('📥 PATCH /api/configuracion');
    console.log('Datos recibidos:', JSON.stringify({
      gmailEmail: data.gmailEmail,
      gmailPassword: data.gmailPassword ? `[${data.gmailPassword.length} chars]` : 'empty/null',
      telegramBotToken: data.telegramBotToken ? `[${data.telegramBotToken.length} chars]` : 'empty/null',
      gmailActivo: data.gmailActivo,
      telegramActivo: data.telegramActivo,
    }));
    
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

    // Solo actualizar contraseñas/tokens si vienen con valor NO vacío
    const gmailPassword = data.gmailPassword?.trim();
    const telegramBotToken = data.telegramBotToken?.trim();
    
    if (gmailPassword && gmailPassword.length > 0) {
      updateData.gmailPassword = gmailPassword;
      console.log('✅ Se actualizará gmailPassword');
    } else {
      console.log('⏭️ No se actualizará gmailPassword (vacío o no enviado)');
    }
    
    if (telegramBotToken && telegramBotToken.length > 0) {
      updateData.telegramBotToken = telegramBotToken;
      console.log('✅ Se actualizará telegramBotToken');
    } else {
      console.log('⏭️ No se actualizará telegramBotToken (vacío o no enviado)');
    }
    
    if (data.twilioAccountSid) {
      updateData.twilioAccountSid = data.twilioAccountSid;
    }
    if (data.twilioAuthToken?.trim()) {
      updateData.twilioAuthToken = data.twilioAuthToken.trim();
    }

    console.log('📝 Campos a actualizar:', Object.keys(updateData));

    if (!config) {
      config = await db.configuracion.create({ data: updateData });
      console.log('➕ Nuevo registro creado');
    } else {
      config = await db.configuracion.update({ 
        where: { id: config.id }, 
        data: updateData 
      });
      console.log('📝 Registro actualizado');
    }

    // Verificar que se guardó
    const verificado = await db.configuracion.findFirst();
    console.log('🔍 Verificación post-guardado:');
    console.log('   - gmailEmail:', verificado?.gmailEmail || '(vacío)');
    console.log('   - gmailPassword:', verificado?.gmailPassword ? '✓ CONFIGURADO' : '✗ NO CONFIGURADO');
    console.log('   - telegramBotToken:', verificado?.telegramBotToken ? '✓ CONFIGURADO' : '✗ NO CONFIGURADO');
    console.log('='.repeat(50));

    return NextResponse.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    console.error('❌ Error PATCH config:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
