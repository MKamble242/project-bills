export type AppLanguage = "en" | "hi" | "mr";

export type AppDictionaryKey =
  | "navHome"
  | "navBills"
  | "navCustomers"
  | "navSettings"
  | "newBill"
  | "pendingDue"
  | "collected"
  | "totalBilled"
  | "recentBills"
  | "viewAllBills"
  | "createBill"
  | "reviewBill"
  | "reviewFinalize"
  | "saveBill"
  | "saveDraft"
  | "continueEditing"
  | "workItemDescription"
  | "addWorkItem"
  | "qty"
  | "rate"
  | "lineTotal"
  | "grandTotal"
  | "advanceReceived"
  | "balanceDue"
  | "simpleBill"
  | "taxInvoice"
  | "sendWhatsApp"
  | "recordPayment"
  | "recordCashPayment"
  | "recordUpiPayment"
  | "downloadPdf"
  | "printBill"
  | "callCustomer"
  | "paid"
  | "unpaid"
  | "partial"
  | "draft"
  | "appPreferences"
  | "appLanguage"
  | "whatsAppMessageLanguage"
  | "savedOnThisPhone"
  | "backupNotCreatedYet"
  | "downloadBackupFile"
  | "restoreFromBackup"
  | "deleteAllLocalData"
  | "upiPaymentQr"
  | "setupUpiQr"
  | "appLanguageNote";

export type AppDictionary = Record<AppDictionaryKey, string>;

export const languageOptions: Array<{ value: AppLanguage; label: string; subtitle: string }> = [
  { value: "en", label: "English", subtitle: "English" },
  { value: "hi", label: "हिंदी", subtitle: "Hindi" },
  { value: "mr", label: "मराठी", subtitle: "Marathi" },
];

export const dictionaries: Record<AppLanguage, AppDictionary> = {
  en: {
    navHome: "Home",
    navBills: "Bills",
    navCustomers: "Customers",
    navSettings: "Settings",
    newBill: "+ New Bill",
    pendingDue: "Pending Due",
    collected: "Collected",
    totalBilled: "Total Billed",
    recentBills: "Recent Bills",
    viewAllBills: "View All Bills",
    createBill: "Create Bill",
    reviewBill: "Review Bill",
    reviewFinalize: "Review & Finalize",
    saveBill: "Save Bill",
    saveDraft: "Save Draft",
    continueEditing: "Continue Editing",
    workItemDescription: "Work or Item Description",
    addWorkItem: "+ Add Work / Item",
    qty: "Qty",
    rate: "Rate",
    lineTotal: "Line Total",
    grandTotal: "Grand Total",
    advanceReceived: "Advance Received",
    balanceDue: "Balance Due",
    simpleBill: "Simple Bill",
    taxInvoice: "Tax Invoice (GST)",
    sendWhatsApp: "Send on WhatsApp",
    recordPayment: "Record Payment",
    recordCashPayment: "Record Cash Payment",
    recordUpiPayment: "Record UPI Payment",
    downloadPdf: "Download PDF",
    printBill: "Print Bill",
    callCustomer: "Call Customer",
    paid: "PAID",
    unpaid: "UNPAID",
    partial: "PARTIAL",
    draft: "DRAFT",
    appPreferences: "App Preferences",
    appLanguage: "App Language",
    whatsAppMessageLanguage: "WhatsApp Message Language",
    savedOnThisPhone: "Saved on This Phone",
    backupNotCreatedYet: "Backup Not Created Yet",
    downloadBackupFile: "Download Backup File",
    restoreFromBackup: "Restore from Backup",
    deleteAllLocalData: "Delete All Local Data",
    upiPaymentQr: "UPI Payment QR",
    setupUpiQr: "Set up UPI QR to collect payment",
    appLanguageNote: "Bills, customer details, and notes will not be translated automatically.",
  },
  hi: {
    navHome: "होम",
    navBills: "बिल",
    navCustomers: "ग्राहक",
    navSettings: "सेटिंग्स",
    newBill: "+ नया बिल",
    pendingDue: "बकाया",
    collected: "संग्रहित",
    totalBilled: "कुल बिल",
    recentBills: "हाल के बिल",
    viewAllBills: "सभी बिल देखें",
    createBill: "बिल बनाएं",
    reviewBill: "बिल की समीक्षा",
    reviewFinalize: "समीक्षा और अंतिम रूप",
    saveBill: "बिल सेव करें",
    saveDraft: "ड्राफ्ट सेव करें",
    continueEditing: "संपादन जारी रखें",
    workItemDescription: "कार्य या आइटम विवरण",
    addWorkItem: "+ कार्य / आइटम जोड़ें",
    qty: "मात्रा",
    rate: "दर",
    lineTotal: "लाइन कुल",
    grandTotal: "कुल योग",
    advanceReceived: "एडवांस प्राप्त",
    balanceDue: "बकाया राशि",
    simpleBill: "साधारण बिल",
    taxInvoice: "टैक्स इंस्वॉयस (GST)",
    sendWhatsApp: "व्हाट्सऐप पर भेजें",
    recordPayment: "भुगतान दर्ज करें",
    recordCashPayment: "नकद भुगतान दर्ज करें",
    recordUpiPayment: "UPI भुगतान दर्ज करें",
    downloadPdf: "PDF डाउनलोड",
    printBill: "बिल प्रिंट करें",
    callCustomer: "ग्राहक को कॉल करें",
    paid: "भुगतान किया",
    unpaid: "अवैतनिक",
    partial: "आंशिक",
    draft: "ड्राफ्ट",
    appPreferences: "ऐप प्राथमिकताएं",
    appLanguage: "ऐप भाषा",
    whatsAppMessageLanguage: "व्हाट्सऐप संदेश भाषा",
    savedOnThisPhone: "इस फोन पर सेव है",
    backupNotCreatedYet: "बैकअप अभी बनाया नहीं गया",
    downloadBackupFile: "बैकअप फ़ाइल डाउनलोड करें",
    restoreFromBackup: "बैकअप से पुनर्स्थापित करें",
    deleteAllLocalData: "सभी लोकल डेटा हटाएं",
    upiPaymentQr: "UPI भुगतान QR",
    setupUpiQr: "भुगतान लेने के लिए UPI QR सेट अप करें",
    appLanguageNote: "बिल, ग्राहक विवरण और नोट्स अपने आप अनुवाद नहीं किए जाएंगे।",
  },
  mr: {
    navHome: "मुख्यपृष्ठ",
    navBills: "बिले",
    navCustomers: "ग्राहक",
    navSettings: "सेटिंग्स",
    newBill: "+ नवीन बिल",
    pendingDue: "प्रलंबित देय",
    collected: "जमा",
    totalBilled: "एकूण बिल",
    recentBills: "अलीकडील बिले",
    viewAllBills: "सर्व बिले पहा",
    createBill: "बिल तयार करा",
    reviewBill: "बिल तपासा",
    reviewFinalize: "तपासणी आणि अंतिम रूप",
    saveBill: "बिल जतन करा",
    saveDraft: "ड्राफ्ट जतन करा",
    continueEditing: "संपादन सुरू ठेवा",
    workItemDescription: "काम किंवा आयटम तपशील",
    addWorkItem: "+ काम / आयटम जोडा",
    qty: "प्रमाण",
    rate: "दर",
    lineTotal: "लाइन टोटल",
    grandTotal: "एकूण",
    advanceReceived: "आगाऊ मिळाले",
    balanceDue: "देय बाकी",
    simpleBill: "साधे बिल",
    taxInvoice: "कर बिल (GST)",
    sendWhatsApp: "व्हॉट्सॲपवर पाठवा",
    recordPayment: "पेमेंट नोंदवा",
    recordCashPayment: "रोख पेमेंट नोंदवा",
    recordUpiPayment: "UPI पेमेंट नोंदवा",
    downloadPdf: "PDF डाउनलोड करा",
    printBill: "बिल प्रिंट करा",
    callCustomer: "ग्राहकांना कॉल करा",
    paid: "पेड",
    unpaid: "नविन",
    partial: "आंशिक",
    draft: "ड्राफ्ट",
    appPreferences: "ऐप प्राधान्ये",
    appLanguage: "ऐप भाषा",
    whatsAppMessageLanguage: "व्हॉट्सॲप संदेश भाषा",
    savedOnThisPhone: "या फोनवर जतन केले",
    backupNotCreatedYet: "बॅकअप अद्याप तयार झाले नाही",
    downloadBackupFile: "बॅकअप फाइल डाउनलोड करा",
    restoreFromBackup: "बॅकअपमधून पुनर्स्थापित करा",
    deleteAllLocalData: "सर्व लोकल डेटा हटवा",
    upiPaymentQr: "UPI पेमेंट QR",
    setupUpiQr: "पेमेंट घेतल्यासाठी UPI QR सेट अप करा",
    appLanguageNote: "बिले, ग्राहक तपशील आणि नोट्स ऑटो ट्रान्सलेट केले जाणार नाहीत.",
  },
};

export const appLanguageStorageKey = "project-bills.app-language.v1";

export function getBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("mr")) return "mr";
  if (browserLanguage.startsWith("hi")) return "hi";
  return "en";
}

export function readStoredAppLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(appLanguageStorageKey);
    if (raw === "en" || raw === "hi" || raw === "mr") return raw;
  } catch {
    return null;
  }
  return null;
}

export function getInitialAppLanguage(): AppLanguage {
  const stored = readStoredAppLanguage();
  if (stored) return stored;
  return getBrowserLanguage();
}

export function setStoredAppLanguage(language: AppLanguage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(appLanguageStorageKey, language);
    document.documentElement.lang = language;
  } catch {
    // Ignore storage errors for the UI preference.
  }
}

export function getDictionary(language: AppLanguage): AppDictionary {
  return dictionaries[language] ?? dictionaries.en;
}
