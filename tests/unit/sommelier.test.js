import { describe, expect, it, vi } from 'vitest';
import { MAX_TOOL_STEPS, parseSommelierReply, runSommelier, seenWines, sommelierPrompt } from '@/server/sommelier';

const user = (content) => ({ role: 'user', content });

describe('parseSommelierReply', () => {
  it('tool sau răspuns; altceva e invalid', () => {
    expect(parseSommelierReply({ tool: 'searchWines', args: { query: 'rosii' } })).toEqual({ tool: 'searchWines', args: { query: 'rosii' } });
    expect(parseSommelierReply({ answer: ' Deschide X ', wineIds: ['a', 3] })).toEqual({ answer: 'Deschide X', wineIds: ['a'] });
    expect(() => parseSommelierReply({ foo: 1 })).toThrow();
  });
});

describe('sommelierPrompt', () => {
  it('include regulile, tool-urile și conversația', () => {
    const prompt = sommelierPrompt({ messages: [user('Ce deschid diseară la miel, sub 100 lei?')], steps: [] });
    expect(prompt).toContain('Never invent wines');
    expect(prompt).toContain('searchWines(');
    expect(prompt).toContain('USER: Ce deschid diseară la miel, sub 100 lei?');
  });
});

describe('runSommelier', () => {
  it('cheamă tool-uri, apoi răspunde doar cu vinuri văzute în rezultate', async () => {
    const replies = [
      { tool: 'searchWines', args: { query: 'rosii', maxPrice: 100 } },
      { answer: 'Deschide Fetească Neagră: taninuri fine pentru miel.', wineIds: ['w1', 'inventat'] },
    ];
    const generate = vi.fn(async () => ({ result: replies.shift(), usage: [{ operation: 'sommelier' }] }));
    const runTool = vi.fn(async () => ({ result: { wines: [{ id: 'w1', name: 'Fetească Neagră' }, { id: 'w2', name: 'Merlot' }] } }));
    const out = await runSommelier({ messages: [user('Ce deschid la miel sub 100 lei?')], generate, runTool });
    expect(runTool).toHaveBeenCalledWith('searchWines', { query: 'rosii', maxPrice: 100 });
    expect(out.wines).toEqual([{ id: 'w1', name: 'Fetească Neagră' }]);
    expect(out.tools).toEqual(['searchWines']);
    expect(out.usage).toHaveLength(2);
    expect(generate.mock.calls[1][0]).toContain('TOOL searchWines');
  });

  it('după MAX_TOOL_STEPS cere răspunsul final', async () => {
    const generate = vi.fn(async (prompt) => ({ result: prompt.includes('must answer now') ? { answer: 'Gata', wineIds: [] } : { tool: 'getAvailableBottles', args: {} } }));
    const runTool = vi.fn(async () => ({ result: { wines: [] } }));
    const out = await runSommelier({ messages: [user('?')], generate, runTool });
    expect(runTool).toHaveBeenCalledTimes(MAX_TOOL_STEPS);
    expect(out.answer).toBe('Gata');
  });

  it('erorile de tool ajung la model ca rezultat, nu opresc conversația', async () => {
    const replies = [{ tool: 'getWine', args: { id: 'x' } }, { answer: 'Nu găsesc vinul.', wineIds: [] }];
    const generate = vi.fn(async () => ({ result: replies.shift() }));
    const out = await runSommelier({ messages: [user('?')], generate, runTool: async () => ({ error: 'Acces interzis' }) });
    expect(generate.mock.calls[1][0]).toContain('"error":"Acces interzis"');
    expect(out.answer).toBe('Nu găsesc vinul.');
  });
});

describe('seenWines', () => {
  it('adună vinurile din orice nivel al rezultatelor', () => {
    expect([...seenWines([{ output: { wines: [{ id: 'a', name: 'A' }] } }, { output: { id: 'b', name: 'B', grapes: [] } }]).keys()]).toEqual(['a', 'b']);
  });
});
