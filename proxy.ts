import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { normalizeBasePath } from "./utils/appPath";

const PROTECTED_ROUTES = ["/dashboard", "/wines", "/settings", "/profile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = normalizeBasePath(
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? "",
  );
  const appPathname =
    basePath && pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length)
      : pathname;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => appPathname === route || appPathname.startsWith(`${route}/`),
  );

  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL(`${basePath}/sign-in`, request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${basePath}${appPathname}` || "/",
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
