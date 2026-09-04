import type { JobEntry, JobExpense, JobExpenseType, JobStatus, JobWithExpenses } from "@/types/job";

const databaseName = "project-bills";
const databaseVersion = 5;
const jobStores = ["jobs", "job_expenses"] as const;

type JobDraft = Pick<JobEntry, "customerName" | "title" | "totalAmountPaise" | "receivedAmountPaise">;

function logJobStorageIssue(context: string, error: unknown, database?: IDBDatabase) {
  if (process.env.NODE_ENV === "production") return;
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("[Job storage diagnostic]", {
    context,
    errorName,
    errorMessage,
    databaseName,
    expectedVersion: databaseVersion,
    availableObjectStores: database ? Array.from(database.objectStoreNames) : [],
  });
}

function ensureStore(database: IDBDatabase, storeName: (typeof jobStores)[number]): void {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "id" });
  }
}

function openDatabaseAtVersion(version: number, attempt = 0): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      const error = new Error("IndexedDB is unavailable in this environment.");
      logJobStorageIssue("indexedDB unavailable", error);
      reject(error);
      return;
    }

    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      const database = request.result;
      jobStores.forEach((store) => ensureStore(database, store));
    };
    request.onsuccess = () => {
      const database = request.result;
      const missingStores = jobStores.filter((store) => !database.objectStoreNames.contains(store));
      if (missingStores.length > 0 && version < databaseVersion + 10) {
        database.close();
        if (attempt < 3) {
          setTimeout(() => {
            void openDatabaseAtVersion(version + 1, attempt + 1).then(resolve).catch(reject);
          }, 100 * (attempt + 1));
          return;
        }
        const upgradeError = new Error("The local job database is missing required stores.");
        logJobStorageIssue("missing required object stores", upgradeError, database);
        reject(upgradeError);
        return;
      }
      resolve(database);
    };
    request.onerror = () => {
      const error = request.error || new Error("Could not open local job storage.");
      const shouldRetry = attempt < 3 && (
        error.name === "InvalidStateError" ||
        error.name === "NotFoundError" ||
        /locked|upgrade|pending/i.test(error.message)
      );
      if (shouldRetry) {
        logJobStorageIssue("retrying blocked job database open", error);
        setTimeout(() => {
          void openDatabaseAtVersion(version, attempt + 1).then(resolve).catch(reject);
        }, 150 * (attempt + 1));
        return;
      }
      logJobStorageIssue("job database open failed", error);
      reject(error);
    };
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return openDatabaseAtVersion(databaseVersion);
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Local job storage failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Local job storage was aborted."));
  });
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value) && value.length <= 120;
}

function validPositivePaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validNonNegativePaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isJobStatus(value: unknown): value is JobStatus {
  return value === "active" || value === "completed";
}

function isJobExpenseType(value: unknown): value is JobExpenseType {
  return value === "material" || value === "travel" || value === "labour" || value === "other";
}

export function validateJobEntry(value: unknown): JobEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (!validId(candidate.id) || typeof candidate.customerName !== "string" || !candidate.customerName.trim() || typeof candidate.title !== "string" || !candidate.title.trim() || !validPositivePaise(candidate.totalAmountPaise) || !validNonNegativePaise(candidate.receivedAmountPaise) || candidate.receivedAmountPaise > candidate.totalAmountPaise || !isJobStatus(candidate.status) || !validTimestamp(candidate.createdAt) || !validTimestamp(candidate.updatedAt)) return null;
  return {
    id: candidate.id,
    customerName: candidate.customerName.trim().slice(0, 200),
    title: candidate.title.trim().slice(0, 200),
    totalAmountPaise: candidate.totalAmountPaise,
    receivedAmountPaise: candidate.receivedAmountPaise,
    status: candidate.status,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function validateJobExpense(value: unknown): JobExpense | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (!validId(candidate.id) || !validId(candidate.jobId) || !isJobExpenseType(candidate.type) || !validPositivePaise(candidate.amountPaise) || typeof candidate.note !== "string" || typeof candidate.date !== "string" || !validDate(candidate.date) || !validTimestamp(candidate.createdAt)) return null;
  return { id: candidate.id, jobId: candidate.jobId, type: candidate.type, amountPaise: candidate.amountPaise, note: candidate.note.trim().slice(0, 200), date: candidate.date, createdAt: candidate.createdAt };
}

function calculateJob(job: JobEntry, expenses: JobExpense[]): JobWithExpenses {
  const totalJobExpensesPaise = expenses.reduce((sum, expense) => sum + expense.amountPaise, 0);
  return { ...job, expenses, customerBalancePaise: job.totalAmountPaise - job.receivedAmountPaise, totalJobExpensesPaise, netAmountPaise: job.totalAmountPaise - totalJobExpensesPaise };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Local job storage failed."));
  });
}

export async function listLocalJobs(): Promise<JobWithExpenses[]> {
  const database = await openDatabase();
  const transaction = database.transaction([...jobStores], "readonly");
  const [rawJobs, rawExpenses] = await Promise.all([
    requestResult(transaction.objectStore("jobs").getAll()),
    requestResult(transaction.objectStore("job_expenses").getAll()),
  ]);
  database.close();
  const jobs = (rawJobs as unknown[]).map(validateJobEntry).filter((job): job is JobEntry => job !== null);
  const expenses = (rawExpenses as unknown[]).map(validateJobExpense).filter((expense): expense is JobExpense => expense !== null);
  return jobs.map((job) => calculateJob(job, expenses.filter((expense) => expense.jobId === job.id))).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createLocalJob(draft: JobDraft): Promise<JobEntry> {
  if (!draft.customerName.trim() || !draft.title.trim() || !validPositivePaise(draft.totalAmountPaise) || !validNonNegativePaise(draft.receivedAmountPaise) || draft.receivedAmountPaise > draft.totalAmountPaise) throw new Error("Please enter valid job details.");
  const now = new Date().toISOString();
  const job = validateJobEntry({ ...draft, id: `job_${crypto.randomUUID()}`, status: "active", createdAt: now, updatedAt: now });
  if (!job) throw new Error("Please enter valid job details.");
  const database = await openDatabase();
  const transaction = database.transaction("jobs", "readwrite");
  transaction.objectStore("jobs").add(job);
  await transactionComplete(transaction);
  database.close();
  return job;
}

export async function recordJobPayment(jobId: string, amountPaise: number): Promise<JobEntry> {
  const database = await openDatabase();
  const transaction = database.transaction("jobs", "readwrite");
  const store = transaction.objectStore("jobs");
  const current = validateJobEntry(await requestResult(store.get(jobId)));
  if (!current) throw new Error("This job could not be found.");
  if (!validPositivePaise(amountPaise) || current.receivedAmountPaise + amountPaise > current.totalAmountPaise) throw new Error("Payment cannot be more than the remaining customer balance.");
  const updated = { ...current, receivedAmountPaise: current.receivedAmountPaise + amountPaise, updatedAt: new Date().toISOString() };
  store.put(updated);
  await transactionComplete(transaction);
  database.close();
  return updated;
}

export async function addJobExpense(jobId: string, expense: Omit<JobExpense, "id" | "createdAt" | "jobId">): Promise<JobExpense> {
  const validated = validateJobExpense({ ...expense, jobId, id: `job_expense_${crypto.randomUUID()}`, createdAt: new Date().toISOString() });
  if (!validated) throw new Error("Please enter a valid job expense.");
  const database = await openDatabase();
  const transaction = database.transaction(["jobs", "job_expenses"], "readwrite");
  const job = validateJobEntry(await requestResult(transaction.objectStore("jobs").get(jobId)));
  if (!job) throw new Error("This job could not be found.");
  transaction.objectStore("job_expenses").add(validated);
  await transactionComplete(transaction);
  database.close();
  return validated;
}

export async function completeLocalJob(jobId: string): Promise<JobEntry> {
  const database = await openDatabase();
  const transaction = database.transaction("jobs", "readwrite");
  const store = transaction.objectStore("jobs");
  const current = validateJobEntry(await requestResult(store.get(jobId)));
  if (!current) throw new Error("This job could not be found.");
  const updated = { ...current, status: "completed" as const, updatedAt: new Date().toISOString() };
  store.put(updated);
  await transactionComplete(transaction);
  database.close();
  return updated;
}

export async function readRawLocalJobs(): Promise<{ jobs: JobEntry[]; jobExpenses: JobExpense[] }> {
  const database = await openDatabase();
  const transaction = database.transaction([...jobStores], "readonly");
  const [rawJobs, rawExpenses] = await Promise.all([requestResult(transaction.objectStore("jobs").getAll()), requestResult(transaction.objectStore("job_expenses").getAll())]);
  database.close();
  return {
    jobs: (rawJobs as unknown[]).map(validateJobEntry).filter((job): job is JobEntry => job !== null),
    jobExpenses: (rawExpenses as unknown[]).map(validateJobExpense).filter((expense): expense is JobExpense => expense !== null),
  };
}
