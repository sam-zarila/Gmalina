import { NextRequest, NextResponse } from "next/server";

// POST /api/pay
// Proxies the PayChangu Standard Checkout request server-side.
// The secret key never leaves the server — no CSRF issues.
export async function POST(req: NextRequest) {
  const secKey = process.env.PAYCHANGU_SECRET_KEY || "";

  if (!secKey) {
    return NextResponse.json(
      { error: "Payment not configured. Add PAYCHANGU_SECRET_KEY to environment variables." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    bookingRef, firestoreId, amount, currency = "MWK",
    firstName, lastName, email, phone,
    roomType, nights, totalAmount, depositAmount, balanceAmount,
    checkIn, checkOut,
  } = body;

  const PROD_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gmalina-court.netlify.app";
  const txRef    = `${bookingRef}-${Date.now()}`;

  try {
    const res = await fetch("https://api.paychangu.com/payment", {
      method: "POST",
      headers: {
        "Accept":        "application/json",
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${secKey}`,
      },
      body: JSON.stringify({
        amount:        String(amount),
        currency,
        email,
        first_name:    firstName,
        last_name:     lastName,
        callback_url:  `${PROD_URL}/?ref=${bookingRef}&tx_ref=${txRef}&status=success`,
        return_url:    `${PROD_URL}/?ref=${bookingRef}&tx_ref=${txRef}&status=success`,
        tx_ref:        txRef,
        customization: {
          title:       "Gmalina Court Lodge — Booking Deposit",
          description: `20% deposit · ${roomType} · ${nights} night${nights !== 1 ? "s" : ""} · Ref: ${bookingRef}`,
        },
        meta: { bookingRef, firestoreId, roomType, checkIn, checkOut, nights, totalAmount, depositAmount, balanceAmount },
      }),
    });

    const data = await res.json();

    if (data.status === "success" && data.data?.checkout_url) {
      return NextResponse.json({ checkout_url: data.data.checkout_url });
    }

    return NextResponse.json(
      { error: data.message || "PayChangu did not return a checkout URL." },
      { status: 502 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to reach PayChangu: " + (err.message || "Network error") },
      { status: 502 }
    );
  }
}