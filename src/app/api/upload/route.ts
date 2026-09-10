import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se encontró la imagen' }, { status: 400 });
    }

    // Convertimos el archivo a ArrayBuffer y luego a Blob para asegurar compatibilidad en Node.js
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type: file.type });

    const apiKey = "1c62ff9f688a221f7ee6b5c0c660f5e1";
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', blob, file.name);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true, url: result.data.url });
    } else {
      console.error('Respuesta de ImgBB:', result);
      return NextResponse.json({ success: false, error: 'Error en la respuesta de ImgBB' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
