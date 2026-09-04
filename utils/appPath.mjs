export function normalizeBasePath(value) {
    const raw = value?.toString().trim() || '';
    if (!raw || raw === '/') return '';
    return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

export function configuredBasePath(env = process.env) {
    return normalizeBasePath(env.NEXT_PUBLIC_BASE_URL ?? env.BASE_URL ?? '');
}

export function appPath(path = '/') {
    const basePath = configuredBasePath();
    const cleanPath = `/${path}`.replace(/\/+/g, '/');
    return `${basePath}${cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '')}`;
}