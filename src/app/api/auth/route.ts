import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'recordatorios-secret-key-2024';

// Login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const admin = await db.admin.findUnique({ where: { username } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return NextResponse.json({ success: false, error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (!admin.activo) {
      return NextResponse.json({ success: false, error: 'Usuario inactivo' }, { status: 403 });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      admin: { id: admin.id, nombre: admin.nombre, username: admin.username, rol: admin.rol }
    });
  } catch (error) {
    console.error('Error en auth:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// Verificar token
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const admin = await db.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, nombre: true, username: true, rol: true }
    });

    if (!admin) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, admin });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
