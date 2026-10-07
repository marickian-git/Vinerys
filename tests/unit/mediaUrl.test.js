import { describe, expect, it } from 'vitest';
import { getDisplayImageUrl } from '@/utils/mediaUrl';

const KEY = 'wines/labels/abc123_1_x.webp';

describe('getDisplayImageUrl', () => {
  it('rutează URL-urile MinIO prin proxy-ul intern, cu basePath', () => {
    expect(getDisplayImageUrl(`http://host:9010/vinerys/${encodeURIComponent(KEY)}`)).toBe(`/crama/api/media/${KEY}`);
  });

  it('adaugă lățimea doar pentru valorile permise', () => {
    const url = `https://host/minio/vinerys/${KEY}`;
    expect(getDisplayImageUrl(url, { width: 480 })).toBe(`/crama/api/media/${KEY}?w=480`);
    expect(getDisplayImageUrl(url, { width: 123 })).toBe(`/crama/api/media/${KEY}`);
  });

  it('lasă neschimbate valorile goale sau externe', () => {
    expect(getDisplayImageUrl(null)).toBeNull();
    expect(getDisplayImageUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });
});
