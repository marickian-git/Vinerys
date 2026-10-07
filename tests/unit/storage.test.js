import { describe, expect, it } from 'vitest';
import { objectKeyFromUrl, parseObjectKey } from '@/utils/storage';

const USER = 'P68EPq8fZAlo3RNkFU9K4KXPQ8h8lMDR';

describe('parseObjectKey', () => {
  it('extrage folderul și proprietarul', () => {
    expect(parseObjectKey(`wines/labels/${USER}_1772756163890_image.jpg`)).toEqual({
      key: `wines/labels/${USER}_1772756163890_image.jpg`, folder: 'wines/labels', ownerId: USER,
    });
    expect(parseObjectKey(`avatars/${USER}_1_ab12.webp`)?.folder).toBe('avatars');
  });

  it.each([
    '../etc/passwd',
    `wines/labels/../../${USER}_1_x.jpg`,
    `secret/${USER}_1_x.jpg`,
    'wines/labels/no-owner.jpg',
    `wines/labels/${USER}_1_x.jpg/extra`,
    '',
  ])('respinge chei invalide: %s', (key) => {
    expect(parseObjectKey(key)).toBeNull();
  });
});

describe('objectKeyFromUrl', () => {
  it('decodează URL-urile istorice cu %2F', () => {
    const url = `http://casa-spiridus.go.ro:9010/vinerys/wines%2Flabels%2F${USER}_1772756163890_image.jpg`;
    expect(objectKeyFromUrl(url)).toBe(`wines/labels/${USER}_1772756163890_image.jpg`);
  });

  it('acceptă și URL-ul prin reverse proxy', () => {
    const url = `https://casa-spiridus.go.ro/minio/vinerys/avatars/${USER}_1_ab.webp`;
    expect(objectKeyFromUrl(url)).toBe(`avatars/${USER}_1_ab.webp`);
  });

  it('întoarce null pentru URL-uri străine sau invalide', () => {
    expect(objectKeyFromUrl('https://example.com/img.jpg')).toBeNull();
    expect(objectKeyFromUrl('not a url')).toBeNull();
    expect(objectKeyFromUrl(null)).toBeNull();
  });
});
