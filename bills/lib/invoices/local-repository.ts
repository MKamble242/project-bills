import type { BusinessProfile, Customer, Invoice, InvoiceDraft, InvoiceItem, PaymentEvent, SyncStatus } from "@/types/invoice";
import { readShopEntries, shopEntriesStorageKey, validateShopEntry, type ShopEntry } from "@/lib/shop-entries";
import { readRawLocalJobs, validateJobEntry, validateJobExpense } from "@/lib/jobs/repository";
import type { JobEntry, JobExpense } from "@/types/job";
import type { ClassFeeEntry, Student } from "@/types/class";
import { validateClassFeeEntry, validateStudent } from "@/lib/classes/repository";
import { readDiaryProfile, validateDiaryProfile, writeDiaryProfile, type DiaryProfile } from "@/lib/profession";
import { calculateItemTotals } from "./calculations";

const databaseName = "project-bills";
const databaseVersion = 5;
const stores = ["invoices", "profiles", "customers", "payment_events", "sync_queue", "app_metadata", "jobs", "job_expenses", "students", "class_fee_entries"] as const;

type MetadataValue = number | string | boolean;
type Metadata = { key: string; value: MetadataValue };

function ensureStore(database: IDBDatabase, storeName: (typeof stores)[number]): void {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: storeName === "app_metadata" ? "key" : "id" });
  }
}

function openDatabaseAtVersion(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      const database = request.result;
      stores.forEach((store) => ensureStore(database, store));
    };
    request.onsuccess = () => {
      const database = request.result;
      const missingStores = stores.filter((store) => !database.objectStoreNames.contains(store));
      if (missingStores.length > 0 && version < databaseVersion + 10) {
        database.close();
        void openDatabaseAtVersion(version + 1).then(resolve).catch(reject);
        return;
      }
      resolve(database);
    };
    request.onerror = () => reject(request.error || new Error("Could not open local invoice storage."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return openDatabaseAtVersion(databaseVersion);
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Local storage transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Local storage transaction was aborted."));
  });
}

function normalizeInvoice(invoice: Invoice): Invoice {
  const paymentEvents = invoice.paymentEvents || [];
  const paidAmount = paymentEvents.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    ...invoice,
    documentType: invoice.documentType ?? "simple_bill",
    clientId: invoice.clientId || invoice.id,
    syncStatus: invoice.syncStatus || "local_only",
    version: invoice.version || 1,
    paymentEvents,
    paidAmount: invoice.paidAmount ?? paidAmount,
    outstandingAmount: invoice.outstandingAmount ?? Math.max(0, invoice.total - paidAmount),
    items: invoice.items || [{ id: crypto.randomUUID(), description: invoice.description, quantity: invoice.quantity, unitPrice: invoice.price, gstRate: invoice.gstRate }],
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Local invoice storage failed."));
  });
}

async function nextInvoiceNumber(database: IDBDatabase) {
  const transaction = database.transaction("app_metadata", "readwrite");
  const metadata = transaction.objectStore("app_metadata");
  const current = (await requestResult(metadata.get("invoice_sequence"))) as Metadata | undefined;
  const sequence = typeof current?.value === "number" ? current.value + 1 : 1;
  metadata.put({ key: "invoice_sequence", value: sequence });
  await transactionComplete(transaction);
  return `BILLS-LOCAL-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}

function toInvoice(draft: InvoiceDraft, invoiceNumber: string): Invoice {
  const now = new Date().toISOString();
  const items = draft.items || [{ id: crypto.randomUUID(), description: draft.description, quantity: draft.quantity, unitPrice: draft.price, gstRate: draft.gstRate }];
  const totals = calculateItemTotals(items);
  const advanceAmount = draft.advanceReceived ?? 0;
  if (!Number.isFinite(advanceAmount) || advanceAmount < 0 || advanceAmount > totals.total) {
    throw new Error("Advance received cannot be more than total amount.");
  }
  const advancePayment = advanceAmount > 0 ? {
    id: `local_payment_${crypto.randomUUID()}`,
    invoiceId: "",
    amount: advanceAmount,
    paymentDate: draft.invoiceDate || now.slice(0, 10),
    paymentMethod: draft.advancePaymentMethod || "upi",
    paymentReference: null,
    notes: "Advance received when invoice was created.",
    createdAt: now,
  } satisfies Omit<PaymentEvent, "invoiceId"> & { invoiceId: string } : null;
  const paidAmount = Math.min(advanceAmount, totals.total);
  return {
    ...draft,
    items,
    id: `local_${crypto.randomUUID()}`,
    clientId: crypto.randomUUID(),
    invoiceNumber: invoiceNumber,
    ...totals,
    status: paidAmount >= totals.total && totals.total > 0 ? "paid" : paidAmount > 0 ? "partially_paid" : "approved",
    paymentEvents: advancePayment ? [advancePayment as PaymentEvent] : [],
    syncStatus: "local_only" as SyncStatus,
    version: 1,
    createdAt: now,
    updatedAt: now,
    storageMode: "local",
    paidAmount,
    outstandingAmount: Math.max(0, totals.total - paidAmount),
  };
}

export async function createLocalInvoice(draft: InvoiceDraft): Promise<Invoice> {
  const database = await openDatabase();
  const invoice = toInvoice(draft, await nextInvoiceNumber(database));
  invoice.paymentEvents = invoice.paymentEvents.map((payment) => ({ ...payment, invoiceId: invoice.id }));
  const transaction = database.transaction(["invoices", "payment_events", "sync_queue"], "readwrite");
  transaction.objectStore("invoices").add(invoice);
  invoice.paymentEvents.forEach((payment) => transaction.objectStore("payment_events").add({ ...payment, invoiceId: invoice.id }));
  transaction.objectStore("sync_queue").add({ id: crypto.randomUUID(), clientId: invoice.clientId, operation: "create", status: "pending", createdAt: invoice.createdAt });
  await transactionComplete(transaction);
  database.close();
  return invoice;
}

export async function listLocalInvoices(): Promise<Invoice[]> {
  const database = await openDatabase();
  const transaction = database.transaction("invoices", "readonly");
  const invoices = await requestResult(transaction.objectStore("invoices").getAll()) as Invoice[];
  database.close();
  return invoices.map(normalizeInvoice).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getLocalInvoice(id: string): Promise<Invoice | null> {
  const database = await openDatabase();
  const invoice = await requestResult(database.transaction("invoices", "readonly").objectStore("invoices").get(id)) as Invoice | undefined;
  database.close();
  return invoice ? normalizeInvoice(invoice) : null;
}

export async function recordLocalPayment(id: string, details: Pick<PaymentEvent, "amount" | "paymentDate" | "paymentMethod" | "paymentReference" | "notes">): Promise<Invoice> {
  const invoice = await getLocalInvoice(id);
  if (!invoice) throw new Error("This local invoice could not be found.");
  const outstandingAmount = invoice.outstandingAmount;
  if (details.amount <= 0 || details.amount > outstandingAmount) throw new Error("Payment must be greater than zero and no more than the outstanding amount.");
  const now = new Date().toISOString();
  const payment: PaymentEvent = { id: `local_payment_${crypto.randomUUID()}`, invoiceId: id, ...details, createdAt: now };
  const paidAmount = invoice.paidAmount + details.amount;
  const updated: Invoice = { ...invoice, status: paidAmount >= invoice.total ? "paid" : "partially_paid", paymentEvents: [...invoice.paymentEvents, payment], paidAmount, outstandingAmount: Math.max(0, invoice.total - paidAmount), syncStatus: "pending", version: invoice.version + 1, updatedAt: now };
  const database = await openDatabase();
  const transaction = database.transaction(["invoices", "payment_events", "sync_queue"], "readwrite");
  transaction.objectStore("invoices").put(updated);
  transaction.objectStore("payment_events").add(payment);
  transaction.objectStore("sync_queue").add({ id: crypto.randomUUID(), clientId: invoice.clientId, operation: "payment", status: "pending", createdAt: now });
  await transactionComplete(transaction);
  database.close();
  return updated;
}

export async function readAppMetadata(key: string): Promise<MetadataValue | undefined> {
  const database = await openDatabase();
  const metadata = await requestResult(database.transaction("app_metadata", "readonly").objectStore("app_metadata").get(key)) as Metadata | undefined;
  database.close();
  return metadata?.value;
}

export async function writeAppMetadata(key: string, value: MetadataValue): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction("app_metadata", "readwrite");
  transaction.objectStore("app_metadata").put({ key, value });
  await transactionComplete(transaction);
  database.close();
}

export async function getLocalProfile(): Promise<BusinessProfile | null> {
  const database = await openDatabase();
  const profile = await requestResult(database.transaction("profiles", "readonly").objectStore("profiles").get("profile")) as BusinessProfile | undefined;
  database.close();
  return profile || null;
}

export async function saveLocalProfile(profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">): Promise<BusinessProfile> {
  const existing = await getLocalProfile();
  const saved: BusinessProfile = { ...profile, id: "profile", createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  const database = await openDatabase();
  const transaction = database.transaction("profiles", "readwrite");
  transaction.objectStore("profiles").put(saved);
  await transactionComplete(transaction);
  database.close();
  return saved;
}

export async function listLocalCustomers(): Promise<Customer[]> {
  const database = await openDatabase();
  const customers = await requestResult(database.transaction("customers", "readonly").objectStore("customers").getAll()) as Customer[];
  database.close();
  return customers;
}

export type LocalBackup = {
  app: "Project BILLS";
  backupVersion: 1;
  createdAt: string;
  storageMode: "local";
  profession: DiaryProfile | null;
  profile: BusinessProfile | null;
  customers: Customer[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  paymentEvents: PaymentEvent[];
  shopEntries: ShopEntry[];
  jobs: JobEntry[];
  jobExpenses: JobExpense[];
  students: Student[];
  classFeeEntries: ClassFeeEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isCustomer(value: unknown): value is Customer { return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.phone === "string"; }
function isInvoice(value: unknown): value is Invoice { return isRecord(value) && typeof value.id === "string" && typeof value.invoiceNumber === "string" && typeof value.customerName === "string" && typeof value.total === "number" && typeof value.createdAt === "string"; }
function isPayment(value: unknown): value is PaymentEvent { return isRecord(value) && typeof value.id === "string" && typeof value.invoiceId === "string" && typeof value.amount === "number" && typeof value.paymentDate === "string"; }
function isItem(value: unknown): value is InvoiceItem { return isRecord(value) && typeof value.id === "string" && typeof value.description === "string" && typeof value.quantity === "number" && typeof value.unitPrice === "number" && typeof value.gstRate === "number" && typeof value.lineTotal === "number"; }

export function validateLocalBackup(input: unknown): { backup: LocalBackup; invalidRecords: number } {
  if (!isRecord(input) || input.app !== "Project BILLS" || input.backupVersion !== 1 || input.storageMode !== "local" || typeof input.createdAt !== "string" || !Array.isArray(input.customers) || !Array.isArray(input.invoices) || !Array.isArray(input.paymentEvents)) throw new Error("Invalid backup format. Choose a Project BILLS JSON backup.");
  const customers = input.customers.filter(isCustomer);
  const invoices = input.invoices.filter(isInvoice).map(normalizeInvoice);
  const paymentEvents = input.paymentEvents.filter(isPayment);
  const invoiceItems = (Array.isArray(input.invoiceItems) ? input.invoiceItems : invoices.flatMap((invoice) => invoice.items)).filter(isItem);
  const shopEntries = (Array.isArray(input.shopEntries) ? input.shopEntries : []).map(validateShopEntry).filter((entry): entry is ShopEntry => entry !== null);
  const jobs = (Array.isArray(input.jobs) ? input.jobs : []).map(validateJobEntry).filter((job): job is JobEntry => job !== null);
  const jobIds = new Set(jobs.map((job) => job.id));
  const jobExpenses = (Array.isArray(input.jobExpenses) ? input.jobExpenses : []).map(validateJobExpense).filter((expense): expense is JobExpense => expense !== null && jobIds.has(expense.jobId));
  const students = (Array.isArray(input.students) ? input.students : []).map(validateStudent).filter((student): student is Student => student !== null);
  const studentIds = new Set(students.map((student) => student.id));
  const classFeeEntries = (Array.isArray(input.classFeeEntries) ? input.classFeeEntries : []).map(validateClassFeeEntry).filter((entry): entry is ClassFeeEntry => entry !== null && studentIds.has(entry.studentId));
  const profile = input.profile === null || input.profile === undefined ? null : isRecord(input.profile) && typeof input.profile.businessName === "string" ? input.profile as BusinessProfile : null;
  const profession = input.profession === null || input.profession === undefined ? null : validateDiaryProfile(input.profession);
  const invalidRecords = input.customers.length - customers.length + input.invoices.length - invoices.length + input.paymentEvents.length - paymentEvents.length + (Array.isArray(input.invoiceItems) ? input.invoiceItems.length - invoiceItems.length : 0) + (Array.isArray(input.shopEntries) ? input.shopEntries.length - shopEntries.length : 0) + (Array.isArray(input.jobs) ? input.jobs.length - jobs.length : 0) + (Array.isArray(input.jobExpenses) ? input.jobExpenses.length - jobExpenses.length : 0) + (Array.isArray(input.students) ? input.students.length - students.length : 0) + (Array.isArray(input.classFeeEntries) ? input.classFeeEntries.length - classFeeEntries.length : 0);
  if (invoices.length === 0 && input.invoices.length > 0) throw new Error("The backup contains no valid invoices.");
  return { backup: { app: "Project BILLS", backupVersion: 1, createdAt: input.createdAt, storageMode: "local", profession, profile, customers, invoices, invoiceItems, paymentEvents, shopEntries, jobs, jobExpenses, students, classFeeEntries }, invalidRecords };
}

export async function createLocalBackup(): Promise<LocalBackup> {
  const database = await openDatabase();
  const transaction = database.transaction(["profiles", "customers", "invoices", "payment_events"], "readonly");
  const [profile, customers, invoices, paymentEvents] = await Promise.all([
    requestResult(transaction.objectStore("profiles").get("profile")),
    requestResult(transaction.objectStore("customers").getAll()),
    requestResult(transaction.objectStore("invoices").getAll()),
    requestResult(transaction.objectStore("payment_events").getAll()),
  ]);
  database.close();
  const normalizedInvoices = (invoices as Invoice[]).map(normalizeInvoice);
  const invoiceItems: InvoiceItem[] = [];
  normalizedInvoices.forEach((invoice) => (invoice.items || []).forEach((item) => { if (item) invoiceItems.push({ ...item, lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100 }); }));
  const { jobs, jobExpenses } = await readRawLocalJobs();
  const { students, feeEntries } = await (async () => {
    try {
      const { readRawStudents, readRawClassFeeEntries } = await import("@/lib/classes/repository");
      const [classStudents, classFeeEntries] = await Promise.all([readRawStudents(), readRawClassFeeEntries()]);
      return { students: classStudents, feeEntries: classFeeEntries };
    } catch {
      return { students: [] as Student[], feeEntries: [] as ClassFeeEntry[] };
    }
  })();
  return { app: "Project BILLS", backupVersion: 1, createdAt: new Date().toISOString(), storageMode: "local", profession: readDiaryProfile(), profile: (profile as BusinessProfile | undefined) || null, customers: customers as Customer[], invoices: normalizedInvoices, invoiceItems, paymentEvents: paymentEvents as PaymentEvent[], shopEntries: readShopEntries(), jobs, jobExpenses, students, classFeeEntries: feeEntries };
}

export async function importLocalBackup(backup: LocalBackup, options: { replaceProfile: boolean } = { replaceProfile: false }) {
  const shopEntries = (Array.isArray(backup.shopEntries) ? backup.shopEntries : []).map(validateShopEntry).filter((entry): entry is ShopEntry => entry !== null);
  const jobs = (Array.isArray(backup.jobs) ? backup.jobs : []).map(validateJobEntry).filter((job): job is JobEntry => job !== null);
  const jobIds = new Set(jobs.map((job) => job.id));
  const jobExpenses = (Array.isArray(backup.jobExpenses) ? backup.jobExpenses : []).map(validateJobExpense).filter((expense): expense is JobExpense => expense !== null && jobIds.has(expense.jobId));
  const students = (Array.isArray(backup.students) ? backup.students : []).map(validateStudent).filter((student): student is Student => student !== null);
  const studentIds = new Set(students.map((student) => student.id));
  const classFeeEntries = (Array.isArray(backup.classFeeEntries) ? backup.classFeeEntries : []).map(validateClassFeeEntry).filter((entry): entry is ClassFeeEntry => entry !== null && studentIds.has(entry.studentId));
  const database = await openDatabase();
  const transaction = database.transaction(["profiles", "customers", "invoices", "payment_events", "jobs", "job_expenses", "students", "class_fee_entries"], "readwrite");
  const profiles = transaction.objectStore("profiles");
  const existingInvoices = await requestResult(transaction.objectStore("invoices").getAll()) as Invoice[];
  const existingCustomers = await requestResult(transaction.objectStore("customers").getAll()) as Customer[];
  const existingPayments = await requestResult(transaction.objectStore("payment_events").getAll()) as PaymentEvent[];
  const existingJobs = await requestResult(transaction.objectStore("jobs").getAll()) as JobEntry[];
  const existingJobExpenses = await requestResult(transaction.objectStore("job_expenses").getAll()) as JobExpense[];
  const existingStudents = await requestResult(transaction.objectStore("students").getAll()) as Student[];
  const existingClassFeeEntries = await requestResult(transaction.objectStore("class_fee_entries").getAll()) as ClassFeeEntry[];
  const invoiceIds = new Set(existingInvoices.map((invoice) => invoice.id));
  const invoiceNumbers = new Set(existingInvoices.map((invoice) => invoice.invoiceNumber));
  const customerIds = new Set(existingCustomers.map((customer) => customer.id));
  const paymentIds = new Set(existingPayments.map((payment) => payment.id));
  const jobIdsExisting = new Set(existingJobs.map((job) => job.id));
  const jobExpenseIdsExisting = new Set(existingJobExpenses.map((expense) => expense.id));
  const studentIdsExisting = new Set(existingStudents.map((student) => student.id));
  const classFeeEntryIdsExisting = new Set(existingClassFeeEntries.map((entry) => entry.id));
  const studentStore = transaction.objectStore("students");
  const classFeeEntryStore = transaction.objectStore("class_fee_entries");
  const jobStore = transaction.objectStore("jobs");
  const jobExpenseStore = transaction.objectStore("job_expenses");
  let imported = 0;
  let skipped = 0;
  const importedInvoiceIds = new Set<string>();
  backup.customers.forEach((customer) => { if (customerIds.has(customer.id)) skipped++; else { transaction.objectStore("customers").add(customer); customerIds.add(customer.id); imported++; } });
  backup.invoices.forEach((invoice) => { if (invoiceIds.has(invoice.id) || invoiceNumbers.has(invoice.invoiceNumber)) skipped++; else { transaction.objectStore("invoices").add(normalizeInvoice(invoice)); invoiceIds.add(invoice.id); invoiceNumbers.add(invoice.invoiceNumber); importedInvoiceIds.add(invoice.id); imported++; } });
  backup.paymentEvents.forEach((payment) => { if (paymentIds.has(payment.id) || !importedInvoiceIds.has(payment.invoiceId)) skipped++; else { transaction.objectStore("payment_events").add(payment); paymentIds.add(payment.id); imported++; } });
  if (options.replaceProfile && backup.profile) profiles.put(backup.profile);
  jobs.forEach((job) => { if (jobIdsExisting.has(job.id)) skipped++; else { jobStore.add(job); jobIdsExisting.add(job.id); imported++; } });
  jobExpenses.forEach((expense) => { if (jobExpenseIdsExisting.has(expense.id)) skipped++; else { jobExpenseStore.add(expense); jobExpenseIdsExisting.add(expense.id); imported++; } });
  students.forEach((student) => { if (studentIdsExisting.has(student.id)) skipped++; else { studentStore.add(student); studentIdsExisting.add(student.id); imported++; } });
  classFeeEntries.forEach((entry) => { if (classFeeEntryIdsExisting.has(entry.id) || !studentIdsExisting.has(entry.studentId)) skipped++; else { classFeeEntryStore.add(entry); classFeeEntryIdsExisting.add(entry.id); imported++; } });
  await transactionComplete(transaction);
  database.close();
  const existingShopEntries = readShopEntries();
  const shopEntryIds = new Set(existingShopEntries.map((entry) => entry.id));
  const mergedShopEntries = [...existingShopEntries, ...shopEntries.filter((entry) => !shopEntryIds.has(entry.id))];
  skipped += shopEntries.length - (mergedShopEntries.length - existingShopEntries.length);
  imported += mergedShopEntries.length - existingShopEntries.length;
  window.localStorage.setItem(shopEntriesStorageKey, JSON.stringify(mergedShopEntries));
  if (options.replaceProfile && backup.profession) writeDiaryProfile(backup.profession);
  return { imported, skipped, profileReplaced: options.replaceProfile && Boolean(backup.profile) };
}
