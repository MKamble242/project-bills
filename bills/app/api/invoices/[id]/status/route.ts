import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const statuses = new Set(["sent", "paid", "cancelled"]);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const status =
      typeof body === "object" && body !== null && "status" in body
        ? body.status
        : null;

    if (typeof status !== "string" || !statuses.has(status)) {
      return NextResponse.json({ error: "Invalid invoice status." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id)
      .select("id, invoice_number, status")
      .single();

    if (error || !data) {
      console.error("Invoice status update error:", error?.message || "Not found");
      return NextResponse.json({ error: "We could not update this invoice." }, { status: 502 });
    }

    return NextResponse.json({ invoice: data });
  } catch {
    return NextResponse.json({ error: "We could not update this invoice." }, { status: 500 });
  }
}
