import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured yet." } },
      { status: 503 }
    );
  }

  try {
    const body: unknown = await request.json();
    const amount = typeof body === "object" && body !== null && "amount" in body ? body.amount : null;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: { code: "INVALID_PAYMENT", message: "A positive payment amount is required." } }, { status: 400 });
    }

    const { id } = await context.params;
    const supabase = await createClient();
    const { data: payment, error: paymentError } = await supabase
      .from("payment_events")
      .insert({ invoice_id: id, amount })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError.message);
      return NextResponse.json({ error: { code: "PAYMENT_FAILED", message: "We could not record this payment." } }, { status: 502 });
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", id);

    if (invoiceError) {
      console.error("Invoice payment status error:", invoiceError.message);
      return NextResponse.json({ error: { code: "PAYMENT_STATUS_FAILED", message: "Payment was recorded, but invoice status could not be updated." } }, { status: 502 });
    }

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: "SUPABASE_UNAVAILABLE", message: "We could not reach your invoice database." } }, { status: 502 });
  }
}
