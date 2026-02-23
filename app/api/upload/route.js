import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { uploadFile } from '@/lib/minio';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'bottle' sau 'label'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generează nume unic pentru fișier
    const extension = file.name.split('.').pop();
    const fileName = `${userId}/${type}/${generateUUID()}.${extension}`;

    // Upload la MinIO
    const url = await uploadFile(file, process.env.MINIO_BUCKET, fileName);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}