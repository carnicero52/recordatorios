import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - Subir imagen y retornar base64
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 });
    }
    
    // Verificar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
    }
    
    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen debe ser menor a 5MB' }, { status: 400 });
    }
    
    // Convertir a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    return NextResponse.json({ 
      success: true, 
      url: base64,
      size: file.size,
      type: file.type
    });
    
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
