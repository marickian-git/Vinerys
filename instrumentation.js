// Next.js: hook-ul global pentru erorile din server components, route handlers și server actions (REFACTOR-006).
export async function register() {}

export async function onRequestError(error, request, context) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { createLogger, serializeError } = await import('./utils/logger');
  const { reportError } = await import('./utils/errorReporting');
  createLogger('next').error('request error', {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    digest: error?.digest,
    error: serializeError(error),
  });
  await reportError(error, {
    tags: { routeType: context.routeType, routePath: context.routePath, digest: error?.digest },
    request: { url: request.path, method: request.method },
  });
}
