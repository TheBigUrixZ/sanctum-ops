import { NextResponse } from "next/server";
import { dollarsToCents } from "@/lib/codes";
import { expenseCategories } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const amount = dollarsToCents(body.amount || 0);
  const note = String(body.note || "").trim();
  const spentAt = body.date ? new Date(String(body.date)) : new Date();

  if (!name) {
    return NextResponse.json({ error: "Expense name is required." }, { status: 400 });
  }

  if (!expenseCategories.includes(category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  if (Number.isNaN(spentAt.getTime())) {
    return NextResponse.json({ error: "Expense date is invalid." }, { status: 400 });
  }

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        name,
        category,
        amount,
        spentAt,
        note: note || null,
      },
    });

    await tx.activityLog.create({
      data: {
        type: "ADDED_EXPENSE",
        itemName: name,
        note: category,
      },
    });

    return created;
  });

  return NextResponse.json(expense, { status: 201 });
}
