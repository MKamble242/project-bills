# Project BILLS v0.1.0-beta

Project BILLS is frozen as a private beta for fast, manual invoicing by contractors, freelancers, shop owners, and other small local businesses.

## Included

- Manual invoice creation with multiple line items
- Per-item GST calculation and INR totals
- Local invoice review, approval, and detail pages
- PDF download and print-friendly invoice output
- WhatsApp deep links for invoice sharing and payment reminders
- UPI payment link and QR code generation when a UPI ID is configured
- Manual payment recording with partial-payment support
- Payment history and paid/outstanding balances
- Customer hub with search, sorting, aggregated totals, and ledger history
- JSON backup export and validated restore with preview and duplicate skipping
- Offline app shell, online/offline indicator, and installable PWA metadata

## Architecture

The beta stores invoice, customer, profile, item, and payment data in the browser's IndexedDB database named `project-bills`. The local repository is the source of truth for the private beta. Backup files are JSON and include local IDs so records can be moved between browsers or devices.

The app can be used without an internet connection after its shell has been loaded or installed. A backup should be downloaded before clearing browser data, changing phones, or reinstalling a browser.

## Payment and Sharing Boundaries

UPI links and QR codes open the user's payment app; they do not verify a bank transaction. Payments are recorded manually by the business owner. WhatsApp actions open a prefilled `wa.me` link and do not send messages automatically or report delivery.

## Limitations

- IndexedDB is device- and browser-local storage.
- There is no cloud sync, remote backup, cloud authentication, or multi-device account.
- Payment verification is manual; no payment gateway is included.
- WhatsApp sharing is a user-controlled deep link; no WhatsApp Cloud API is included.
- Clearing browser data without a backup can remove local records.
- Browser support and installed PWA behavior depend on the device and browser.

This release intentionally includes no AI, OCR, camera scanning, Gemini, Vertex, or Google Cloud workflow.
