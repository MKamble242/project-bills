# Architecture Notes

Diary is a Next.js app with a local-first browser data model.

## Screens

The app starts with a diary choice stored in local storage. The choice opens one of four focused experiences: Meri Dukaan, Mera Kaam, Meri Class, or Mere Kharche.

## Storage

Jobs, job expenses, payments, students, and class fee entries use the IndexedDB database `project-bills`. Shop entries, personal expenses, and preferences use local storage.

Money is stored as integer paise for shop, job, class, and personal expense records.

## Backups

A future backup can contain the profile, shop entries, jobs, job expenses, students, class fee entries, and personal expenses. Each local repository validates data before saving.

Job payments are stored separately from the job summary so later payments can be edited or removed without losing the job itself.

## Offline behavior

The service worker caches the app shell and core screens. Local entries remain available without an internet connection.

## Boundaries

Supabase routes remain available for configured deployments, but the private beta's default source of truth is local browser storage. There is no authentication, cloud sync, or payment verification.
