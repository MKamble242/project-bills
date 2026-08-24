import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured yet." } },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, payment_events(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: "INVOICE_NOT_FOUND", message: "This invoice could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "SUPABASE_UNAVAILABLE", message: "We could not reach your invoice database." } },
      { status: 502 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured yet." } },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("status" in body) || typeof body.status !== "string") {
      return NextResponse.json({ error: { code: "INVALID_STATUS", message: "A valid invoice status is required." } }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: body.status })
      .eq("id", id)
      .select("id, invoice_number, status")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: { code: "INVOICE_UPDATE_FAILED", message: "We could not update this invoice." } }, { status: 502 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: { code: "SUPABASE_UNAVAILABLE", message: "We could not reach your invoice database." } }, { status: 502 });
  }
}
