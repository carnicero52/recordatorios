import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando base de datos...');
  
  // Hashear contraseña
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Crear admin por defecto
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      nombre: 'Administrador',
      rol: 'admin',
      activo: true,
    },
  });
  
  console.log('✅ Admin creado/actualizado:', admin.username);
  
  // Crear configuración inicial si no existe
  const config = await prisma.configuracion.findFirst();
  if (!config) {
    await prisma.configuracion.create({
      data: {
        nombreSistema: 'Sistema de Recordatorios Multicanal',
        horaEjecucion: '09:00',
      },
    });
    console.log('✅ Configuración inicial creada');
  } else {
    console.log('ℹ️ Configuración ya existe');
  }
  
  console.log('🎉 Base de datos inicializada correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
