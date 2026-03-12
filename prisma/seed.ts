import { db } from '../src/lib/db';
import crypto from 'crypto';

async function main() {
  console.log('🌱 Inicializando base de datos...');

  // Crear configuración inicial
  const existingConfig = await db.configuracion.findFirst();
  
  if (!existingConfig) {
    await db.configuracion.create({
      data: {
        nombreNegocio: 'Barbería Estilo',
        lema: 'Donde el estilo se encuentra contigo',
        telefono: '+52 123 456 7890',
        whatsapp: '521234567890',
        email: 'contacto@barberia.com',
        direccion: 'Av. Principal #123, Centro',
        horarioLunes: '9:00 AM - 7:00 PM',
        horarioMartes: '9:00 AM - 7:00 PM',
        horarioMiercoles: '9:00 AM - 7:00 PM',
        horarioJueves: '9:00 AM - 7:00 PM',
        horarioViernes: '9:00 AM - 7:00 PM',
        horarioSabado: '9:00 AM - 5:00 PM',
        horarioDomingo: 'Cerrado',
        mensajeWhatsapp: 'Hola! Me gustaría agendar una cita.',
      }
    });
    console.log('✅ Configuración creada');
  } else {
    console.log('✅ Configuración ya existe');
  }

  // Crear servicios si no existen
  const existingServicios = await db.servicio.count();
  
  if (existingServicios === 0) {
    const servicios = [
      { nombre: 'Corte de Cabello', precio: 15, duracion: 30, descripcion: 'Corte clásico o moderno', orden: 1 },
      { nombre: 'Barba', precio: 10, duracion: 20, descripcion: 'Recorte y perfilado de barba', orden: 2 },
      { nombre: 'Corte + Barba', precio: 22, duracion: 45, descripcion: 'Combo completo de corte y barba', orden: 3 },
      { nombre: 'Afeitado Clásico', precio: 12, duracion: 25, descripcion: 'Afeitado tradicional con navaja', orden: 4 },
      { nombre: 'Corte Niños', precio: 10, duracion: 20, descripcion: 'Corte para niños menores de 12 años', orden: 5 },
      { nombre: 'Lavado + Peinado', precio: 8, duracion: 15, descripcion: 'Lavado capilar y peinado', orden: 6 },
    ];

    for (const servicio of servicios) {
      await db.servicio.create({ data: servicio });
    }
    console.log('✅ Servicios creados');
  } else {
    console.log('✅ Servicios ya existen:', existingServicios);
  }

  // Crear cortes/galería si no existen
  const existingCortes = await db.corte.count();
  
  if (existingCortes === 0) {
    for (let i = 1; i <= 6; i++) {
      await db.corte.create({
        data: {
          titulo: `Estilo ${i}`,
          descripcion: 'Corte profesional y moderno',
          orden: i
        }
      });
    }
    console.log('✅ Galería creada');
  } else {
    console.log('✅ Galería ya existe:', existingCortes);
  }

  // Crear admin si no existe
  const existingAdmin = await db.admin.count();
  
  if (existingAdmin === 0) {
    const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    await db.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nombre: 'Administrador'
      }
    });
    console.log('✅ Admin creado (usuario: admin, contraseña: admin123)');
  } else {
    console.log('✅ Admin ya existe');
  }

  console.log('🎉 Base de datos inicializada correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
