// Erori standard (REFACTOR-004): un singur tip de eroare cu cod, status HTTP și mesaj pentru utilizator.
// Mesajul tehnic (message) ajunge doar în log; utilizatorul vede userMessage.
import { NextResponse } from 'next/server';
import { createLogger, requestIdFrom, serializeError } from './logger';

export const ERROR_CODES = {
  UNAUTHENTICATED: { status: 401, userMessage: 'Neautentificat' },
  FORBIDDEN: { status: 403, userMessage: 'Acces interzis' },
  NOT_FOUND: { status: 404, userMessage: 'Nu a fost găsit' },
  VALIDATION: { status: 400, userMessage: 'Date invalide' },
  RATE_LIMITED: { status: 429, userMessage: 'Prea multe încercări. Încearcă din nou puțin mai târziu.' },
  AI_FAILED: { status: 502, userMessage: 'Serviciul AI nu a răspuns. Încearcă din nou.' },
  STORAGE_FAILED: { status: 500, userMessage: 'Eroare la salvarea fișierului' },
  INTERNAL: { status: 500, userMessage: 'A apărut o eroare neașteptată. Încearcă din nou.' },
};

export class AppError extends Error {
  constructor(code, { message, userMessage, details, cause, headers } = {}) {
    const def = ERROR_CODES[code] ?? ERROR_CODES.INTERNAL;
    super(message ?? userMessage ?? def.userMessage, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.code = ERROR_CODES[code] ? code : 'INTERNAL';
    this.status = def.status;
    this.userMessage = userMessage ?? def.userMessage;
    this.details = details;
    this.headers = headers;
  }
}

export const unauthenticated = () => new AppError('UNAUTHENTICATED');
export const forbidden = () => new AppError('FORBIDDEN');
export const notFound = (userMessage) => new AppError('NOT_FOUND', { userMessage });
export const validationError = (details, userMessage) => new AppError('VALIDATION', { details, userMessage });
export const rateLimited = (userMessage, retryAfter) =>
  new AppError('RATE_LIMITED', { userMessage, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined });

export const isAppError = (error) => error instanceof AppError;

// Forma publică a unei erori: niciodată stack, mesaj tehnic sau date interne
export function toPublicError(error, requestId) {
  const appError = isAppError(error) ? error : new AppError('INTERNAL');
  const body = { error: appError.userMessage, code: appError.code };
  if (appError.details) body.details = appError.details;
  if (requestId) body.requestId = requestId;
  return { status: appError.status, body, headers: appError.headers };
}

// Rezultatul standard pentru server actions care întorc { error } în loc să arunce
export function actionError(error, log) {
  if (!isAppError(error)) log?.error('unexpected action error', { error: serializeError(error) });
  const { body } = toPublicError(error);
  return { error: body.details ?? body.error, code: body.code };
}

// Înfășoară un route handler: erorile AppError devin răspunsuri JSON curate,
// iar cele neprevăzute sunt logate cu requestId și întorc 500 generic.
export function withApiHandler(scope, handler) {
  const logger = createLogger(scope);
  return async (request, context) => {
    const requestId = requestIdFrom(request?.headers);
    const log = logger.child({ requestId });
    try {
      const response = await handler(request, { ...context, log, requestId });
      response?.headers?.set?.('x-request-id', requestId);
      return response;
    } catch (error) {
      if (isAppError(error)) {
        if (error.status >= 500) log.error(error.message, { code: error.code, error: serializeError(error.cause ?? error) });
        else log.info(error.message, { code: error.code });
      } else {
        log.error('unhandled error', { error: serializeError(error) });
      }
      const { status, body, headers } = toPublicError(error, requestId);
      return NextResponse.json(body, { status, headers: { ...headers, 'x-request-id': requestId } });
    }
  };
}
