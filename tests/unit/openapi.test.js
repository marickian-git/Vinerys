import { describe, expect, it } from 'vitest';
import { openApiSpec } from '@/server/openapi';

describe('openApiSpec', () => {
  it('are serverul cu basePath, securitate bearer și toate rutele v1', () => {
    const spec = openApiSpec('https://casa.ro/crama');
    expect(spec.servers[0].url).toBe('https://casa.ro/crama/api/v1');
    expect(spec.components.securitySchemes.bearer.scheme).toBe('bearer');
    expect(Object.keys(spec.paths)).toEqual(['/me', '/wines', '/wines/{id}', '/wines/{id}/consume', '/wines/{id}/tastings', '/wines/{id}/pairing', '/stats']);
  });

  it('toate $ref-urile există în components', () => {
    const refs = [...JSON.stringify(openApiSpec('x')).matchAll(/#\/components\/schemas\/(\w+)/g)].map((m) => m[1]);
    const spec = openApiSpec('x');
    for (const name of new Set(refs)) expect(spec.components.schemas[name], name).toBeDefined();
  });
});
