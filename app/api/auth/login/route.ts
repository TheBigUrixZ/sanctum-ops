import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const expectedUsername = process.env.APP_USERNAME || "admin";
  const expectedPassword = process.env.APP_PASSWORD || "change-me";

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("inventory_session", "local", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
