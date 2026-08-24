import { NextResponse } from "next/server";
import { calculateInvoiceTotals, calculateItemTotals } from "@/lib/invoices/calculations";
import { parseInvoiceDraft } from "@/lib/invoices/validation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured yet." } },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Invoice list error:", error.message);
      return NextResponse.json(
        { error: { code: "SUPABASE_UNAVAILABLE", message: "We could not reach your invoice database." } },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json(
      { error: { code: "SUPABASE_UNAVAILABLE", message: "We could not reach your invoice database." } },
      { status: 502 }
    );
  }
}

function invoiceNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `BILLS-${year}-${suffix}`;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured yet." } },
      { status: 503 }
    );
  }

  try {
    const draft = parseInvoiceDraft(await request.json());
    const totals = draft.items?.length
      ? calculateItemTotals(draft.items)
      : calculateInvoiceTotals(draft.quantity, draft.price, draft.gstRate);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + draft.dueDays);
    const supabase = await createClient();
    const payload = {
      invoice_number: invoiceNumber(),
      customer_name: draft.customerName,
      customer_phone: draft.customerPhone || null,
      description: draft.description,
      quantity: draft.quantity,
      price: draft.price,
      gst_rate: draft.gstRate,
      subtotal: totals.subtotal,
      gst_amount: totals.gstAmount,
      total: totals.total,
      due_days: draft.dueDays,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "approved",
    };
    const { data, error } = await supabase
      .from("invoices")
      .insert(payload)
      .select("id, invoice_number, total, status")
      .single();

    if (error) {
      console.error("Invoice insert error:", error.message);
      return NextResponse.json(
        { error: { code: "SUPABASE_UNAVAILABLE", message: "We could not save this invoice. Please check your connection and try again." } },
        { status: 502 }
      );
    }

    if (draft.items?.length) {
      const { error: itemsError } = await supabase.from("invoice_items").insert(
        draft.items.map((item) => ({
          invoice_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }))
      );
      if (itemsError) {
        console.error("Invoice items insert error:", itemsError.message);
        return NextResponse.json({ error: { code: "INVOICE_ITEMS_FAILED", message: "The invoice was saved, but its items could not be saved." } }, { status: 502 });
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid invoice request.";
    const status = message.startsWith("Please provide") || message.startsWith("Invoice data") ? 400 : 500;
    return NextResponse.json({ error: { code: "INVALID_INVOICE", message } }, { status });
  }
}
