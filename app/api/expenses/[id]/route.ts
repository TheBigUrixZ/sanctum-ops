import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        type: "DELETED_EXPENSE",
        itemName: expense.name,
        note: expense.category,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
