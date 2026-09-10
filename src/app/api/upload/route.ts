import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('image');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se encontró la imagen' }, { status: 400 });
    }

    const apiKey = "1c62ff9f688a221f7ee6b5c0c660f5e1";
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true, url: result.data.url });
    } else {
      return NextResponse.json({ success: false, error: 'Error en la respuesta de ImgBB' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
