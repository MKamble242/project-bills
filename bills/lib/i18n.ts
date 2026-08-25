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
  | "appLanguageNote"
  | "backDashboard"
  | "invoiceDetails"
  | "customer"
  | "noPhone"
  | "paymentDetails"
  | "payByUpi"
  | "editSettings"
  | "close"
  | "notConfigured"
  | "tapToPay"
  | "scanWithUpi"
  | "useEditSettings"
  | "terms"
  | "paymentHistory"
  | "noPayments"
  | "totalPaid"
  | "outstanding"
  | "paidInFull"
  | "settingsStored"
  | "backupStatus"
  | "noInvoices"
  | "createFirstInvoice"
  | "savedInvoices"
  | "localOnly"
  | "showAmounts"
  | "hideAmounts"
  | "businessName"
  | "upiId"
  | "phoneNumber"
  | "gstin"
  | "saveSettings"
  | "backupAndData"
  | "downloadFullBackup"
  | "importBackup";

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
    backDashboard: "Back to dashboard", invoiceDetails: "Invoice details", customer: "Customer", noPhone: "No phone number", paymentDetails: "Payment details", payByUpi: "Pay by UPI", editSettings: "Edit settings", close: "Close", notConfigured: "Not configured", tapToPay: "Tap to Pay", scanWithUpi: "Scan with any UPI app.", useEditSettings: "Use Edit settings to configure payments.", terms: "Terms", paymentHistory: "Payment history", noPayments: "No payments recorded.", totalPaid: "Total paid", outstanding: "Outstanding", paidInFull: "Paid in full. Payment recorded manually.", settingsStored: "These settings are stored only on this device.", backupStatus: "Local backup status", noInvoices: "No invoices yet", createFirstInvoice: "Create first invoice", savedInvoices: "Saved invoices", localOnly: "Local only", showAmounts: "Show amounts", hideAmounts: "Hide amounts", businessName: "Business name", upiId: "UPI ID", phoneNumber: "Phone number", gstin: "GSTIN", saveSettings: "Save settings", backupAndData: "Backup and data", downloadFullBackup: "Download full backup", importBackup: "Import backup",
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
    backDashboard: "डैशबोर्ड पर वापस", invoiceDetails: "बिल विवरण", customer: "ग्राहक", noPhone: "फोन नंबर नहीं है", paymentDetails: "भुगतान विवरण", payByUpi: "UPI से भुगतान", editSettings: "सेटिंग्स बदलें", close: "बंद करें", notConfigured: "सेट नहीं है", tapToPay: "भुगतान करें", scanWithUpi: "किसी भी UPI ऐप से स्कैन करें।", useEditSettings: "भुगतान सेट करने के लिए सेटिंग्स बदलें।", terms: "शर्तें", paymentHistory: "भुगतान इतिहास", noPayments: "कोई भुगतान दर्ज नहीं है।", totalPaid: "कुल भुगतान", outstanding: "बकाया", paidInFull: "पूरा भुगतान हो गया। भुगतान मैन्युअली दर्ज है।", settingsStored: "ये सेटिंग्स केवल इस डिवाइस पर सेव हैं।", backupStatus: "लोकल बैकअप स्थिति", noInvoices: "अभी कोई बिल नहीं है", createFirstInvoice: "पहला बिल बनाएं", savedInvoices: "सेव किए बिल", localOnly: "केवल लोकल", showAmounts: "राशि दिखाएं", hideAmounts: "राशि छिपाएं", businessName: "व्यवसाय का नाम", upiId: "UPI ID", phoneNumber: "फोन नंबर", gstin: "GSTIN", saveSettings: "सेटिंग्स सेव करें", backupAndData: "बैकअप और डेटा", downloadFullBackup: "पूरा बैकअप डाउनलोड करें", importBackup: "बैकअप इम्पोर्ट करें",
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
    unpaid: "अवैतनिक",
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
    appLanguageNote: "बिले, ग्राहक तपशील आणि नोट्स आपोआप अनुवादित होणार नाहीत.",
    backDashboard: "डॅशबोर्डवर परत", invoiceDetails: "बिल तपशील", customer: "ग्राहक", noPhone: "फोन नंबर नाही", paymentDetails: "पेमेंट तपशील", payByUpi: "UPI ने पेमेंट करा", editSettings: "सेटिंग्स बदला", close: "बंद करा", notConfigured: "सेट केलेले नाही", tapToPay: "पेमेंट करा", scanWithUpi: "कोणत्याही UPI अॅपने स्कॅन करा.", useEditSettings: "पेमेंट सेट करण्यासाठी सेटिंग्स बदला.", terms: "अटी", paymentHistory: "पेमेंट इतिहास", noPayments: "पेमेंट नोंदवलेले नाही.", totalPaid: "एकूण पेमेंट", outstanding: "देय बाकी", paidInFull: "पूर्ण पेमेंट झाले. पेमेंट मॅन्युअली नोंदवले आहे.", settingsStored: "या सेटिंग्स फक्त या डिव्हाइसवर जतन आहेत.", backupStatus: "लोकल बॅकअप स्थिती", noInvoices: "अद्याप बिले नाहीत", createFirstInvoice: "पहिले बिल तयार करा", savedInvoices: "जतन केलेली बिले", localOnly: "फक्त लोकल", showAmounts: "रक्कम दाखवा", hideAmounts: "रक्कम लपवा", businessName: "व्यवसायाचे नाव", upiId: "UPI ID", phoneNumber: "फोन नंबर", gstin: "GSTIN", saveSettings: "सेटिंग्स जतन करा", backupAndData: "बॅकअप आणि डेटा", downloadFullBackup: "पूर्ण बॅकअप डाउनलोड करा", importBackup: "बॅकअप इम्पोर्ट करा",
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
