export function normalizeBasePath(value) {
    const raw = value?.toString().trim() || '';
    if (!raw || raw === '/') return '';
    return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

export function configuredBasePath(env = process.env) {
    return normalizeBasePath(env.NEXT_PUBLIC_BASE_URL ?? env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? '');
}

export function configuredAppURL(env = process.env) {
    return (env.NEXT_PUBLIC_APP_URL ?? env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function configuredAuthURL(env = process.env) {
    const appURL = configuredAppURL(env);
    return appURL.endsWith('/api/auth') ? appURL : `${appURL}/api/auth`;
}

export function configuredOrigin(env = process.env) {
    return new URL(configuredAppURL(env)).origin;
}

export function appPath(path = '/') {
    const basePath = configuredBasePath();
    const cleanPath = `/${path}`.replace(/\/+/g, '/');
    return `${basePath}${cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '')}`;
}