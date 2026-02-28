import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import minioClient, { BUCKET, initBucket, getPublicUrl } from '@/utils/minio';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // Verifică autentificare
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'wines';

    if (!file) {
      return NextResponse.json({ error: 'Niciun fișier primit' }, { status: 400 });
    }

    // Validare tip
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tip nepermis. Acceptăm: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validare mărime
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Fișierul e prea mare. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Pregătire buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Nume unic: wines/userId_timestamp_filename.ext
    const ext = file.name.split('.').pop().toLowerCase();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const objectName = `${folder}/${session.user.id}_${Date.now()}_${safeName}`;

    // Init bucket (prima dată)
    await initBucket();

    // Upload către MinIO
    await minioClient.putObject(
      BUCKET,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': file.type }
    );

    const url = getPublicUrl(objectName);

    return NextResponse.json({
      success: true,
      url,
      objectName,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Eroare la upload: ' + error.message },
      { status: 500 }
    );
  }
}