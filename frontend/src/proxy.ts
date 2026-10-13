import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_HOME_PATH, LOGIN_PATH, ROOT_PATH } from "@/modules/auth/constants/login-redirect.constants";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from "@/modules/auth/constants/session.constants";
import { isPublicPath } from "@/modules/auth/utils/route-access";
import { buildLoginUrl } from "@/modules/auth/utils/safe-next-path";
import { isStandaloneEpic4, STANDALONE_EPIC4_HOME_PATH } from "@/shared/config/standalone.config";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Despliegue solo de Epic 4: sin sesión; la raíz y el login llevan a Publicar vacante.
  if (isStandaloneEpic4()) {
    if (pathname === ROOT_PATH || pathname === LOGIN_PATH) {
      return NextResponse.redirect(new URL(STANDALONE_EPIC4_HOME_PATH, request.url), 307);
    }
    return NextResponse.next();
  }

  const hasSession = request.cookies.get(SESSION_COOKIE_NAME)?.value === SESSION_COOKIE_VALUE;

  if (pathname === ROOT_PATH) {
    return NextResponse.redirect(new URL(hasSession ? DEFAULT_HOME_PATH : LOGIN_PATH, request.url), 307);
  }
  if (isPublicPath(pathname) || hasSession) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(buildLoginUrl(`${pathname}${search}`), request.url), 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\..*).*)"],
};
