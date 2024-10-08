import { dev, url_backend } from "@/context/token";
import prisma from "@/lib/prisma";
import { validateAssignOrder } from "@/lib/validations/order";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let orderInfo;
  let orderValidated;

  try {
    orderInfo = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    orderValidated = validateAssignOrder(orderInfo);
  } catch (error) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  let platform;
  let user;
  let order;

  order = await prisma.order.findUnique({
    where: { id: orderValidated.order_id },
  });

  if (!order) {
    return NextResponse.json({ error: "order not exist" }, { status: 500 });
  }

  try {
    platform = await prisma.platform.findUnique({
      where: { id: orderValidated.platform_id },
      select: {
        Account: true,
        price_distributor_in_cents: true,
        price_in_cents: true,
        name: true,
        description: true,
        status: true,
        days_duration: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: "Error: platform not exist" },
        { status: 500 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Error fetching platform" },
      { status: 500 }
    );
  }

  try {
    user = await prisma.user.findUnique({
      where: { id: orderValidated.user_id },
      select: {
        balance_in_cents: true,
        ref_id: true,
        phone: true,
        full_name: true,
        role: true,
        country_code: true, // enviar wsp
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Error: user not exist" },
        { status: 500 }
      );
    }
  } catch (e) {
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }

  try {
    const { user_id, platform_id, status } = orderValidated;

    let account;

    try {
      account = await prisma.account.update({
        where: { id: orderValidated.account_id },
        data: {
          is_active: true,
          user_id: user_id,
          platform_id: platform_id,
          purchase_date: new Date(),
          status: "BOUGHT",
        },
      });
    } catch (e) {
      return NextResponse.json(
        { error: "Error updating account" },
        { status: 500 }
      );
    }

    try {
      const updatedOrder = await prisma.order.update({
        where: { id: orderValidated.order_id },
        data: { status: "ATTENDED" },
      });

      const responseOrder = { ...updatedOrder, account: account };

      const { email, password, pin, description } = account;

      const wspMessage = `👋 Hola \n _Pedido #${
        updatedOrder.id
      } Completado_\n🖥️ Plataforma: ${
        platform.name
      }\n📧 Email: ${email}\n🔑 Password: ${password}\n🔢 Pin: ${pin}\n${
        description ? `📝 Descripción: ${description}\n` : ""
      }🕒 Duración de la cuenta: ${platform.days_duration} días}`;

      const userPhone = user.phone;
      let cookiesesion = dev
        ? "next-auth.session-token"
        : "__Secure-next-auth.session-token";
      const token = req.cookies.get(cookiesesion)?.value as any;

      const url_wsp = `${url_backend}/notifications`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },

        body: JSON.stringify({
          phone: order.phone,
          message: wspMessage,
          country_code: order.country_code,
        }),
      };

      const res = await fetch(url_wsp, options);
      const json = await res.json();

      await prisma.notification.create({
        data: { phone_client: userPhone, message: wspMessage },
      });

      return NextResponse.json({
        ...responseOrder,
        json,
      });
    } catch (e) {
      return NextResponse.json(
        { error: "Error creating order" },
        { status: 500 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Error to create order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
