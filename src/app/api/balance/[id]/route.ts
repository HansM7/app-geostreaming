import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth-options";
import { validateBalance } from "@/lib/validations/balance";
import { convertToCents } from "@/utils/convertToCents";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let session;

  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching session" },
      { status: 500 }
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let balanceUser;
  let validatedBalanceUser;
  let accountId;

  try {
    accountId = Number(params.id);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error processing account ID" },
      { status: 400 }
    );
  }

  try {
    balanceUser = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    validatedBalanceUser = validateBalance(balanceUser);
  } catch (error) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  let user;
  // Actualizar el voucher en la base de datos utilizando Prisma
  await prisma.voucher.update({
    where: { id: validatedBalanceUser.voucher_id },
    data: { status: "READ" },
  });

  const formatCents = convertToCents(validatedBalanceUser.balance_in_cents);

  try {
    user = await prisma.user.update({
      where: { id: accountId },
      data: {
        balance_in_cents: { increment: formatCents },
      },
    });
    await prisma.$disconnect();
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating user balance" },
      { status: 500 }
    );
  }

  return NextResponse.json(user);
}
