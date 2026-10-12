import { describe, expect, it } from 'vitest';
import { SOMMELIER_TOOLS, describeTools, runTool } from '@/server/sommelierTools';

describe('tool-urile Sommelierului', () => {
  it('cele 4 tool-uri cerute de AI-002, descrise pentru prompt', () => {
    expect(Object.keys(SOMMELIER_TOOLS)).toEqual(['searchWines', 'getWine', 'getAvailableBottles', 'getUserPreferences']);
    const text = describeTools();
    expect(text).toContain('searchWines(query?, type?, maxPrice?, inCellarOnly?, limit?)');
    expect(text).toContain('getWine(id)');
  });

  it('respinge tool-urile necunoscute și argumentele invalide fără să atingă DB-ul', async () => {
    expect(await runTool('u1', 'dropTable', {})).toEqual({ error: 'Unknown tool dropTable' });
    expect((await runTool('u1', 'searchWines', { limit: 500 })).error).toMatch(/limit/);
    expect((await runTool('u1', 'searchWines', { type: 'BLUE' })).error).toMatch(/type/);
    expect((await runTool('u1', 'getWine', {})).error).toMatch(/id/);
  });
});
