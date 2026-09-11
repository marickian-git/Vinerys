import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'casa-spiridus.go.ro',
  port: parseInt(process.env.MINIO_PORT) || 9010,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET = process.env.MINIO_BUCKET || 'vinerys';

// Asigură că bucket-ul există și e public
export async function initBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, '');
  }

  // Policy public read pentru imagini
  const policy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${BUCKET}/*`],
    }],
  });

  await minioClient.setBucketPolicy(BUCKET, policy);
}

// Generează URL public pentru un obiect
export function getPublicUrl(objectName) {
  const publicBase = (process.env.MINIO_PUBLIC_URL || 'https://casa-spiridus.go.ro/minio').replace(/\/+$/, '');
  return `${publicBase}/${BUCKET}/${encodeURIComponent(objectName)}`;
}

export default minioClient;