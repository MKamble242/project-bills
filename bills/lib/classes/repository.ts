import type { ClassFeeEntry, Student, StudentFeeSummary } from "@/types/class";

const databaseName = "project-bills";
const databaseVersion = 5;
const classStores = ["students", "class_fee_entries"] as const;

function ensureStore(database: IDBDatabase, storeName: (typeof classStores)[number]): void {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "id" });
  }
}

function openDatabaseAtVersion(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      const database = request.result;
      classStores.forEach((store) => ensureStore(database, store));
    };
    request.onsuccess = () => {
      const database = request.result;
      const missingStores = classStores.filter((store) => !database.objectStoreNames.contains(store));
      if (missingStores.length > 0 && version < databaseVersion + 10) {
        database.close();
        void openDatabaseAtVersion(version + 1).then(resolve).catch(reject);
        return;
      }
      resolve(database);
    };
    request.onerror = () => reject(request.error || new Error("Could not open local class storage."));
  });
}

export function openClassDatabase(): Promise<IDBDatabase> {
  return openDatabaseAtVersion(databaseVersion);
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Class storage transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Class storage transaction was aborted."));
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

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim().slice(0, 200) : fallback;
}

function validPositivePaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validNonNegativePaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function validateStudent(value: unknown): Student | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !/^student_[A-Za-z0-9_-]+$/.test(candidate.id) || typeof candidate.name !== "string" || !candidate.name.trim() || typeof candidate.guardianName !== "string" || typeof candidate.phone !== "string" || !validTimestamp(candidate.createdAt) || !validTimestamp(candidate.updatedAt)) return null;
  const name = candidate.name.trim().slice(0, 200);
  const guardianName = normalizeText(candidate.guardianName, "");
  const phone = normalizeText(candidate.phone, "");
  return {
    id: candidate.id,
    name,
    guardianName,
    phone,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function validateClassFeeEntry(value: unknown): ClassFeeEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !/^class_fee_[A-Za-z0-9_-]+$/.test(candidate.id) || typeof candidate.studentId !== "string" || !/^student_[A-Za-z0-9_-]+$/.test(candidate.studentId) || !validNonNegativePaise(candidate.expectedAmountPaise) || !validNonNegativePaise(candidate.paidAmountPaise) || candidate.paidAmountPaise > candidate.expectedAmountPaise || typeof candidate.date !== "string" || !validDate(candidate.date) || typeof candidate.note !== "string" || !validTimestamp(candidate.createdAt) || !validTimestamp(candidate.updatedAt)) return null;
  return {
    id: candidate.id,
    studentId: candidate.studentId,
    expectedAmountPaise: candidate.expectedAmountPaise,
    paidAmountPaise: candidate.paidAmountPaise,
    date: candidate.date,
    note: candidate.note.trim().slice(0, 200),
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Class data request failed."));
  });
}

export async function readRawStudents(): Promise<Student[]> {
  const database = await openClassDatabase();
  const transaction = database.transaction("students", "readonly");
  const raw = await requestResult<Student[]>(transaction.objectStore("students").getAll());
  database.close();
  return (raw as unknown[]).map(validateStudent).filter((student): student is Student => student !== null);
}

export async function readRawClassFeeEntries(): Promise<ClassFeeEntry[]> {
  const database = await openClassDatabase();
  const transaction = database.transaction("class_fee_entries", "readonly");
  const raw = await requestResult<ClassFeeEntry[]>(transaction.objectStore("class_fee_entries").getAll());
  database.close();
  return (raw as unknown[]).map(validateClassFeeEntry).filter((entry): entry is ClassFeeEntry => entry !== null);
}

export async function listStudentsWithFees(): Promise<StudentFeeSummary[]> {
  const [students, entries] = await Promise.all([readRawStudents(), readRawClassFeeEntries()]);
  const entryMap = new Map<string, ClassFeeEntry[]>();
  entries.forEach((entry) => {
    const list = entryMap.get(entry.studentId) || [];
    list.push(entry);
    entryMap.set(entry.studentId, list);
  });

  return students
    .map((student) => {
      const studentEntries = entryMap.get(student.id) || [];
      const totalExpectedPaise = studentEntries.reduce((sum, entry) => sum + entry.expectedAmountPaise, 0);
      const totalPaidPaise = studentEntries.reduce((sum, entry) => sum + entry.paidAmountPaise, 0);
      const totalPendingPaise = Math.max(0, totalExpectedPaise - totalPaidPaise);
      return {
        ...student,
        entries: [...studentEntries].sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)),
        totalExpectedPaise,
        totalPaidPaise,
        totalPendingPaise,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function createStudent(student: { name: string; guardianName: string; phone: string }): Promise<Student> {
  const name = student.name.trim();
  const guardianName = student.guardianName.trim();
  const phone = student.phone.trim();
  if (!name) throw new Error("Student name is required.");
  const now = new Date().toISOString();
  const validated = validateStudent({ id: `student_${crypto.randomUUID()}`, name, guardianName, phone, createdAt: now, updatedAt: now });
  if (!validated) throw new Error("Please enter valid student details.");
  const database = await openClassDatabase();
  const transaction = database.transaction("students", "readwrite");
  transaction.objectStore("students").put(validated);
  await transactionComplete(transaction);
  database.close();
  return validated;
}

export async function createClassFeeEntry(entry: { studentId: string; expectedAmountPaise: number; paidAmountPaise: number; date: string; note: string }): Promise<ClassFeeEntry> {
  const student = (await readRawStudents()).find((candidate) => candidate.id === entry.studentId);
  if (!student) throw new Error("Student not found.");
  if (!validNonNegativePaise(entry.expectedAmountPaise) || !validNonNegativePaise(entry.paidAmountPaise) || entry.paidAmountPaise > entry.expectedAmountPaise) throw new Error("Expected and paid amounts are invalid.");
  const date = entry.date;
  if (!validDate(date)) throw new Error("Please choose a valid date.");
  const note = entry.note.trim(); 
  const now = new Date().toISOString();
  const validated = validateClassFeeEntry({
    id: `class_fee_${crypto.randomUUID()}`,
    studentId: entry.studentId,
    expectedAmountPaise: entry.expectedAmountPaise,
    paidAmountPaise: entry.paidAmountPaise,
    date,
    note,
    createdAt: now,
    updatedAt: now,
  });
  if (!validated) throw new Error("Please enter valid fee details.");
  const database = await openClassDatabase();
  const transaction = database.transaction("class_fee_entries", "readwrite");
  transaction.objectStore("class_fee_entries").put(validated);
  await transactionComplete(transaction);
  database.close();
  return validated;
}

export async function addClassFeePayment(entryId: string, amountPaise: number): Promise<ClassFeeEntry> {
  if (!validPositivePaise(amountPaise)) throw new Error("Payment amount must be more than zero.");
  const database = await openClassDatabase();
  const transaction = database.transaction("class_fee_entries", "readwrite");
  const store = transaction.objectStore("class_fee_entries");
  const current = validateClassFeeEntry(await requestResult(store.get(entryId)));
  if (!current) throw new Error("This class fee record could not be found.");
  if (current.paidAmountPaise + amountPaise > current.expectedAmountPaise) throw new Error("Payment cannot be more than the remaining fee.");
  const updated: ClassFeeEntry = {
    ...current,
    paidAmountPaise: current.paidAmountPaise + amountPaise,
    updatedAt: new Date().toISOString(),
  };
  store.put(updated);
  await transactionComplete(transaction);
  database.close();
  return updated;
}

export async function listAllClassActivity(): Promise<{ students: Student[]; feeEntries: ClassFeeEntry[] }> {
  const [students, feeEntries] = await Promise.all([readRawStudents(), readRawClassFeeEntries()]);
  return {
    students,
    feeEntries,
  };
}
