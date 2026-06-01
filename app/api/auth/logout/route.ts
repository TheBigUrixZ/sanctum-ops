import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, shouldSetSecureAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldSetSecureAuthCookie(),
    path: "/",
    maxAge: 0,
  });
  return response;
}
