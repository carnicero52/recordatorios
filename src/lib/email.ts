import nodemailer from 'nodemailer';
import { db } from './db';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function enviarEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await db.configuracion.findFirst();

    if (!config || !config.emailActivo || !config.emailRemitente || !config.emailPassword) {
      console.log('Email no está configurado o está desactivado');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailRemitente,
        pass: config.emailPassword
      }
    });

    const mailOptions = {
      from: `"${config.nombreNegocio}" <${config.emailRemitente}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${options.text}</div>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}
