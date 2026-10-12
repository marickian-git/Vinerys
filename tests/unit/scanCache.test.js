import { describe, expect, it, vi } from 'vitest';
import { findCachedScan, hashImage, isCacheable, isFresh, storeScan } from '@/utils/scanCache';

const PNG = Buffer.from('fake-image-bytes').toString('base64');

describe('hashImage', () => {
  it('e stabil și ignoră prefixul data:', () => {
    expect(hashImage(PNG)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashImage(`data:image/png;base64,${PNG}`)).toBe(hashImage(PNG));
    expect(hashImage(Buffer.from('alta').toString('base64'))).not.toBe(hashImage(PNG));
  });
});

describe('isCacheable / isFresh', () => {
  it('doar identificările sigure', () => {
    expect(isCacheable({ name: 'X', confidence: { identity: 0.8 } })).toBe(true);
    expect(isCacheable({ name: 'X', confidence: { identity: 0.4 } })).toBe(false);
    expect(isCacheable({ confidence: { identity: 0.9 } })).toBe(false);
  });

  it('expiră după 180 de zile', () => {
    const now = new Date('2026-10-11');
    expect(isFresh({ createdAt: new Date('2026-06-01') }, now)).toBe(true);
    expect(isFresh({ createdAt: new Date('2026-01-01') }, now)).toBe(false);
    expect(isFresh(null, now)).toBe(false);
  });
});

function fakeDb(entry) {
  return {
    scanCache: {
      findUnique: vi.fn().mockResolvedValue(entry),
      update: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
    },
  };
}

describe('findCachedScan / storeScan', () => {
  it('întoarce intrarea proaspătă și numără hit-ul', async () => {
    const db = fakeDb({ imageHash: 'h', createdAt: new Date(), result: { name: 'X' } });
    expect(await findCachedScan(db, 'h')).toMatchObject({ result: { name: 'X' } });
    expect(db.scanCache.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ hits: { increment: 1 } }) }));
  });

  it('ignoră intrările expirate', async () => {
    const db = fakeDb({ imageHash: 'h', createdAt: new Date('2020-01-01') });
    expect(await findCachedScan(db, 'h')).toBeNull();
    expect(db.scanCache.update).not.toHaveBeenCalled();
  });

  it('salvează doar rezultatele sigure', async () => {
    const db = fakeDb(null);
    expect(await storeScan(db, 'h', { result: { name: 'X', confidence: { identity: 0.3 } }, sources: ['gemini'] })).toBe(false);
    expect(await storeScan(db, 'h', { result: { name: 'X', confidence: { identity: 0.9 } }, sources: ['gemini'] })).toBe(true);
    expect(db.scanCache.upsert).toHaveBeenCalledOnce();
  });
});
