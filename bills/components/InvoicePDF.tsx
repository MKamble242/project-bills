import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type InvoicePDFProps = {
  invoice: {
    invoice_number: string;
    customer_name: string;
    customer_phone: string | null;
    description: string;
    quantity: number | string;
    price: number | string;
    gst_rate: number | string;
    subtotal: number | string;
    gst_amount: number | string;
    total: number | string;
    due_days: number;
    created_at: string;
    items?: Array<{ description: string; quantity: number; unitPrice: number }>;
    document_type?: "simple_bill" | "tax_invoice";
    advance_received?: number;
    outstanding_amount?: number;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 10,
  },
  header: {
    backgroundColor: "#020617",
    color: "#ffffff",
    padding: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  brand: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  invoiceLabel: {
    marginTop: 8,
    fontSize: 10,
    color: "#93c5fd",
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  invoiceNumber: {
    fontSize: 10,
    textAlign: "right",
    color: "#cbd5e1",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  section: {
    width: "45%",
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  bold: {
    fontWeight: "bold",
    fontSize: 11,
  },
  muted: {
    marginTop: 4,
    color: "#64748b",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 12,
    color: "#64748b",
    fontSize: 8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  description: {
    width: "70%",
  },
  amount: {
    width: "30%",
    textAlign: "right",
    fontWeight: "bold",
  },
  summary: {
    width: "40%",
    marginLeft: "auto",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#64748b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dueBox: {
    backgroundColor: "#eff6ff",
    padding: 14,
    borderRadius: 6,
    marginTop: 28,
  },
  dueText: {
    color: "#1e3a8a",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
  },
});

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  const isTaxInvoice = invoice.document_type === "tax_invoice";
  const advanceReceived = Number(invoice.advance_received || 0);
  const outstandingAmount = Number(invoice.outstanding_amount ?? Number(invoice.total) - advanceReceived);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>BILLS</Text>
              <Text style={styles.invoiceLabel}>{isTaxInvoice ? "TAX INVOICE" : "BILL"}</Text>
            </View>

            <View>
              <Text style={styles.invoiceNumber}>
                {invoice.invoice_number}
              </Text>
              <Text style={styles.invoiceNumber}>
                {formatDate(invoice.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.section}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.bold}>Your Business Name</Text>
            <Text style={styles.muted}>Solapur, Maharashtra</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.bold}>{invoice.customer_name}</Text>
            <Text style={styles.muted}>
              {invoice.customer_phone || "No phone number"}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Description</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>

          {(invoice.items || [{ description: invoice.description, quantity: Number(invoice.quantity), unitPrice: Number(invoice.price) }]).map((item, index) => (
            <View style={styles.tableRow} key={`${item.description}-${index}`}>
              <View style={styles.description}>
                <Text style={styles.bold}>{item.description}</Text>
                <Text style={styles.muted}>{item.quantity} × {formatCurrency(item.unitPrice)}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {isTaxInvoice && <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({invoice.gst_rate}%)</Text>
            <Text>{formatCurrency(invoice.gst_amount)}</Text>
          </View>}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {advanceReceived > 0 && <View style={styles.dueBox}>
          <Text style={styles.dueText}>Advance received: {formatCurrency(advanceReceived)}</Text>
          <Text style={styles.dueText}>Balance due: {formatCurrency(outstandingAmount)}</Text>
        </View>}

        <View style={styles.dueBox}>
          <Text style={styles.dueText}>
            {invoice.due_days === 0
              ? "Payment due immediately"
              : `Payment due within ${invoice.due_days} days`}
          </Text>
        </View>

        <Text style={styles.footer}>
          Generated with Project BILLS
        </Text>
      </Page>
    </Document>
  );
}