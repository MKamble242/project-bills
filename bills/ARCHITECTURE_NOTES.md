# Architecture Notes

BILLS is a Next.js app with a local-first browser data model.

## Screens

The app starts with a profession choice stored in local storage. The choice opens one of four focused experiences: Meri Dukaan, Mera Kaam, Meri Class, or Mera Hisaab. Settings, customers, invoice creation, review, and invoice details are shared screens.

## Storage

Invoices, customers, payments, jobs, job expenses, students, and class fee entries use the IndexedDB database `project-bills`. The database version is upgraded by adding missing object stores without deleting existing stores. Shop entries and small preferences use local storage.

Money is stored as integer paise for shop, job, and class records. Invoice calculations use numeric rupee values and round totals to two decimal places.

## Backups

A JSON backup contains the business profile, profession, customers, invoices, invoice items, payments, shop entries, jobs, job expenses, students, and class fee entries. Imported records are validated and added only when their IDs are not already present. A restore asks for confirmation before writing data.

Job payments are stored separately from the job summary so later payments can be edited or removed without losing the job itself.

## Offline behavior

The service worker caches the app shell and core screens. Local records remain available without an internet connection. API routes and invoice detail URLs are allowed to use normal network behavior because local invoice details are loaded by the app itself.

## Boundaries

Supabase routes remain available for configured deployments, but the private beta's default source of truth is local browser storage. There is no authentication, cloud sync, or payment verification.
