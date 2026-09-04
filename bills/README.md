BILLS is a local-first, mobile-friendly money diary for Indian micro-business owners.

## What it does

- Meri Dukaan: record sales, expenses, and today's remaining amount.
- Mera Kaam: track jobs, customer payments, job expenses, balance, and net amount.
- Meri Class: track students, expected fees, payments, and pending fees.
- Mera Hisaab: create invoices, record payments, share bills, and view customer history.
- Settings: save business details and download or restore a complete backup.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No login is required. Production checks are:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Data and privacy

Records are stored in this browser on this device. They are not synced to a server in local mode. Download a backup before changing phones, clearing browser data, or reinstalling the browser. See [PRIVACY_NOTES.md](PRIVACY_NOTES.md) and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Release documents

- [USER_GUIDE.md](USER_GUIDE.md): short instructions for everyday use.
- [CHANGELOG.md](CHANGELOG.md): recent product changes.
- [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md): how screens, storage, backups, and offline mode fit together.
