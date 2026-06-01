import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  shouldSetSecureAuthCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch((error) => {
    console.error("[auth/login] Could not parse login request body.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return {};
  });
  const username = String(body.username || "");
  const password = String(body.password || "");
  const expectedUsername = process.env.APP_USERNAME || "admin";
  const expectedPassword = process.env.APP_PASSWORD || "change-me";

  if (username !== expectedUsername || password !== expectedPassword) {
    console.warn("[auth/login] Invalid login attempt.", {
      usernameProvided: Boolean(username),
      usernameLength: username.length,
      hasConfiguredUsername: Boolean(process.env.APP_USERNAME),
      hasConfiguredPassword: Boolean(process.env.APP_PASSWORD),
    });
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldSetSecureAuthCookie(),
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
