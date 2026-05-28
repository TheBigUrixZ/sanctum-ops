import { NextResponse } from "next/server";
import { cleanCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const code = cleanCode(String(body.code || ""));
  const notes = String(body.notes || "").trim();
  const releaseDate = body.releaseDate ? new Date(String(body.releaseDate)) : null;

  if (!name || !code) {
    return NextResponse.json({ error: "Drop name and code are required." }, { status: 400 });
  }

  if (releaseDate && Number.isNaN(releaseDate.getTime())) {
    return NextResponse.json({ error: "Release date is invalid." }, { status: 400 });
  }

  const drop = await prisma.drop.create({
    data: {
      name,
      code,
      releaseDate,
      notes: notes || null,
    },
  });

  return NextResponse.json(drop, { status: 201 });
}
