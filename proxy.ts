import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((path) => pathname === path) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("inventory_session")?.value;
  if (session === "local") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
