'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// PayChangu redirects here after payment (callback_url and return_url)
// We just redirect to the homepage with the params so the booking modal shows step 5
export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const ref   = sp.get("ref")    || "";
    const txRef = sp.get("tx_ref") || "";
    const status = sp.get("status") || "";

    // Pass params to homepage which will open the booking confirmation
    if (ref && txRef) {
      router.replace(`/?ref=${ref}&tx_ref=${txRef}&status=${status}`);
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#08090a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", color: "#f4f0ea"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Processing your payment…</div>
        <div style={{ fontSize: 14, color: "rgba(244,240,234,0.5)", marginTop: 8 }}>
          Please wait, redirecting you back to your booking.
        </div>
      </div>
    </div>
  );
}