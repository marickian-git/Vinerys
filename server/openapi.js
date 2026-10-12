// ARCH-008: descrierea OpenAPI 3.1 a API-ului /api/v1 (servită la /api/v1/openapi.json)
const json = (schema) => ({ content: { 'application/json': { schema } } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const errors = { 400: { description: 'Date invalide', ...json(ref('Error')) }, 401: { description: 'Neautentificat', ...json(ref('Error')) }, 404: { description: 'Negăsit', ...json(ref('Error')) }, 429: { description: 'Prea multe cereri', ...json(ref('Error')) } };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };

export function openApiSpec(serverUrl) {
  return {
    openapi: '3.1.0',
    info: { title: 'Vinerys API', version: '1.0.0', description: 'API pentru aplicația mobilă. Autentificare: POST /api/auth/sign-in/email întoarce tokenul în headerul `set-auth-token`; trimite-l apoi ca `Authorization: Bearer <token>`.' },
    servers: [{ url: `${serverUrl}/api/v1` }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
      schemas: {
        Error: { type: 'object', properties: { error: {}, code: { type: 'string' }, details: { type: 'object' }, requestId: { type: 'string' } }, required: ['error', 'code'] },
        WineType: { type: 'string', enum: ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'] },
        WineStatus: { type: 'string', enum: ['IN_CELLAR', 'CONSUMED', 'SOLD', 'GIFTED'] },
        WineInput: {
          type: 'object', required: ['name', 'type'],
          properties: {
            name: { type: 'string' }, producer: { type: 'string' }, country: { type: 'string' }, region: { type: 'string' }, subregion: { type: 'string' },
            type: ref('WineType'), color: { type: 'string', enum: ['RED', 'WHITE', 'ROSE', 'ORANGE'] }, vintage: { type: 'integer' },
            grapeVarieties: { type: 'array', items: { type: 'string' } }, alcoholPercentage: { type: 'number' }, quantity: { type: 'integer', minimum: 0 },
            cellarLocation: { type: 'string' }, purchaseDate: { type: 'string', format: 'date' }, purchasePrice: { type: 'number' }, estimatedValue: { type: 'number' },
            rating: { type: 'integer', minimum: 1, maximum: 5 }, tastingNotes: { type: 'string' }, servingTemperature: { type: 'string' },
            foodPairing: { type: 'array', items: { type: 'string' } }, aromaProfile: { type: 'array', items: { type: 'string' } },
            drinkFrom: { type: ['integer', 'null'] }, drinkUntil: { type: ['integer', 'null'] }, bottleSize: { type: 'string' },
            labelImageUrl: { type: 'string', format: 'uri' }, bottleImageUrl: { type: 'string', format: 'uri' }, isFavorite: { type: 'boolean' }, status: ref('WineStatus'),
          },
        },
        Wine: { allOf: [ref('WineInput'), { type: 'object', properties: { id: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
        WineList: { type: 'object', properties: { wines: { type: 'array', items: ref('Wine') }, total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' }, totalPages: { type: 'integer' } } },
        TastingInput: {
          type: 'object',
          properties: {
            tastedAt: { type: 'string', format: 'date-time' }, rating: { type: ['integer', 'null'], minimum: 1, maximum: 5 }, occasion: { type: 'string' },
            people: { type: 'array', items: { type: 'string' } }, food: { type: 'string' }, location: { type: 'string' }, notes: { type: 'string' },
            photoUrls: { type: 'array', items: { type: 'string', format: 'uri' }, maxItems: 6 }, aromas: { type: 'array', items: { type: 'string' } },
          },
        },
        Stats: { type: 'object', properties: { totalBottles: { type: 'integer' }, totalValue: { type: 'number' }, totalWines: { type: 'integer' }, byType: { type: 'object' }, byStatus: { type: 'object' } } },
      },
    },
    paths: {
      '/me': { get: { summary: 'Utilizatorul curent', responses: { 200: { description: 'OK' }, 401: errors[401] } } },
      '/wines': {
        get: {
          summary: 'Lista vinurilor (căutare fuzzy + limbaj natural în `search`)',
          parameters: ['search', 'type', 'status', 'country', 'sort', 'page', 'pageSize', 'vintageMin', 'vintageMax', 'ratingMin', 'priceMax', 'isFavorite'].map((name) => ({ name, in: 'query', schema: { type: 'string' } })),
          responses: { 200: { description: 'OK', ...json(ref('WineList')) }, ...errors },
        },
        post: { summary: 'Vin nou', requestBody: json(ref('WineInput')), responses: { 201: { description: 'Creat', ...json({ type: 'object', properties: { wine: ref('Wine') } }) }, ...errors } },
      },
      '/wines/{id}': {
        parameters: [idParam],
        get: { summary: 'Un vin', responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { wine: ref('Wine') } }) }, ...errors } },
        patch: { summary: 'Modifică doar câmpurile trimise', requestBody: json(ref('WineInput')), responses: { 200: { description: 'OK' }, ...errors } },
        delete: { summary: 'Șterge vinul', responses: { 204: { description: 'Șters' }, ...errors } },
      },
      '/wines/{id}/consume': {
        parameters: [idParam],
        post: { summary: 'Consumă sticle', requestBody: json({ type: 'object', properties: { quantity: { type: 'integer', minimum: 1, default: 1 } } }), responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { remaining: { type: 'integer' } } }) }, ...errors } },
      },
      '/wines/{id}/tastings': {
        parameters: [idParam],
        get: { summary: 'Degustările vinului', responses: { 200: { description: 'OK' }, ...errors } },
        post: { summary: 'Degustare nouă', requestBody: json(ref('TastingInput')), responses: { 201: { description: 'Creat' }, ...errors } },
      },
      '/wines/{id}/pairing': {
        parameters: [idParam, { name: 'refresh', in: 'query', schema: { type: 'string', enum: ['1'] } }],
        get: { summary: '„Ce gătesc cu el?”: 3 preparate, temperatură, decantare (cache pe vin)', responses: { 200: { description: 'OK' }, ...errors } },
      },
      '/sommelier': {
        post: {
          summary: 'Sommelier conversațional (caută în pivnița reală prin tool-uri)',
          requestBody: json({ type: 'object', required: ['messages'], properties: { messages: { type: 'array', maxItems: 20, items: { type: 'object', properties: { role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string', maxLength: 1000 } } } } } }),
          responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { answer: { type: 'string' }, wines: { type: 'array', items: { type: 'object' } }, tools: { type: 'array', items: { type: 'string' } } } }) }, ...errors },
        },
      },
      '/stats': { get: { summary: 'Statistici pivniță', responses: { 200: { description: 'OK', ...json(ref('Stats')) }, ...errors } } },
    },
  };
}
