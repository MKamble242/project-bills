# Diary v0.1.0-beta Test Plan

Use this guide with one or two real contractors, freelancers, shop owners, or other small-business users. Test on a phone first, then repeat the important steps on a desktop browser. Use sample customer information and real-world invoice amounts, but do not enter confidential payment credentials.

## 15-Step Test

1. Open Diary and confirm the dashboard loads with a local-only or saved-on-this-device message.
2. Open Settings and enter a business name and phone number. Save, refresh, and confirm the values remain.
3. Create an invoice for a real-world customer scenario. Enter the customer name, phone, address, invoice date, and due terms.
4. Add line items with different quantities and prices. Remove one item and add it again.
5. Leave one required field invalid and submit. Confirm an inline error appears and the other form values are not lost.
6. Review the record. Check the business details, customer details, items, subtotal, total, and due date.
7. Approve the invoice and confirm the app opens its saved local invoice detail page.
8. Refresh the browser, return to the dashboard, and confirm the invoice is still present.
9. Download the PDF and print the record. Check that the record number, items, totals, and payment summary are readable.
10. Open WhatsApp from the record. Confirm the deep link contains the correct customer, record number, and amount. Confirm the app does not claim the record was sent or the payment was verified.
12. Record a partial payment with a UTR or reference. Confirm the invoice says partially paid and shows the remaining balance.
13. Record the final payment. Confirm the invoice says paid, the remaining balance is zero, and payment history remains after refresh.
14. Open Customers. Search by customer name and phone, sort the list, open the customer ledger, and verify invoice totals, payment totals, outstanding balance, and history.
15. Download a JSON backup, inspect that it contains no secrets, then select Restore from backup. Review the preview, import it while keeping the current profile, and confirm duplicate records are skipped safely.

## Ask Each Tester

- What did you expect to happen at each step?
- Which field or screen took the most effort to understand?
- Could you create an invoice without assistance?
- Did the totals match how you normally calculate them?
- Was the PDF easy to read and share?
- Would you trust the wording around manual payment recording?
- Did the WhatsApp action behave as expected?
- What information is missing from the customer ledger?
- What would make you use Diary weekly?
- What is the one thing you would change before using it with a customer?

Record the device, browser, connection state, step number, expected result, actual result, and screenshot for every problem.
