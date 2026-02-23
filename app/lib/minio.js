import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export async function uploadFile(file, bucket, path) {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Asigură-te că bucket-ul există
  const bucketExists = await minioClient.bucketExists(bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(bucket);
  }

  // Upload file
  await minioClient.putObject(bucket, path, buffer, file.size, {
    'Content-Type': file.type,
  });

  // Generează URL accesibil
  const url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${path}`;
  return url;
}

export async function deleteFile(bucket, path) {
  await minioClient.removeObject(bucket, path);
}

export default minioClient;