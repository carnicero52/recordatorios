import { db } from './db';

export async function enviarTelegram(chatId: string, mensaje: string): Promise<boolean> {
  try {
    const config = await db.configuracion.findFirst();

    if (!config || !config.telegramActivo || !config.telegramBotToken) {
      console.log('Telegram no está configurado o está desactivado');
      return false;
    }

    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Error de Telegram:', data.description);
      return false;
    }

    console.log(`Mensaje de Telegram enviado a ${chatId}`);
    return true;
  } catch (error) {
    console.error('Error enviando mensaje de Telegram:', error);
    return false;
  }
}

export async function getBotInfo(): Promise<any> {
  try {
    const config = await db.configuracion.findFirst();

    if (!config || !config.telegramBotToken) {
      return null;
    }

    const url = `https://api.telegram.org/bot${config.telegramBotToken}/getMe`;
    const response = await fetch(url);
    const data = await response.json();

    return data.ok ? data.result : null;
  } catch (error) {
    console.error('Error obteniendo info del bot:', error);
    return null;
  }
}
