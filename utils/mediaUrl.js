const DEFAULT_PUBLIC_MINIO_URL = 'https://casa-spiridus.go.ro/minio';

function publicMinioUrl() {
  return (process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || DEFAULT_PUBLIC_MINIO_URL).replace(/\/+$/, '');
}

export function getPublicMinioUrl(objectName, bucket = 'vinerys') {
  return `${publicMinioUrl()}/${bucket}/${encodeURIComponent(objectName)}`;
}

export function getDisplayImageUrl(value, bucket = 'vinerys') {
  if (!value) return value;

  try {
    const url = new URL(value);
    const bucketMarker = `/${bucket}/`;
    const bucketIndex = url.pathname.indexOf(bucketMarker);
    if (bucketIndex !== -1) {
      const objectName = decodeURIComponent(url.pathname.slice(bucketIndex + bucketMarker.length));
      return getPublicMinioUrl(objectName, bucket);
    }
  } catch {
    return value;
  }

  return value;
}