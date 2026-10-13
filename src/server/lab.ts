import type { LabProfile } from "../shared/types";

/**
 * Lab details + every image used on the report.
 * To use new artwork (SVG logo, new signature PNG…) drop the files in
 * /public/report-assets and change the paths here — nothing else needs to change.
 */
export const MGPL_LAB: LabProfile = {
  name: "Maa Gayatri Path Lab",
  logoSrc: "/report-assets/logo.svg",
  addressLines: ["In front Of Police Station", "Arang, Raipur, Chhattisgarh"],
  email: "maagaytripatholgylab2006@gmail.com",
  phone: "+91-9340638661",
  signatory: {
    name: "Dr.Gulab Singh (B.Sc., D.M.L.T.)",
    designation: "Lab Tech. / Pathologist",
    // Placeholder in the public package — the real signature is loaded from a private file on the
    // server via MGPL_SIGNATURE_FILE / MGPL_SIGNATURE_HEADER_FILE / MGPL_SIGNATURE_NONHEADER_FILE.
    signatureHeaderSrc: "/report-assets/signature-placeholder.svg",
    signatureNonHeaderSrc: "/report-assets/signature-placeholder.svg",
  },
  qcStampSrc: "/report-assets/qc-stamp.svg",
  icons: {
    emailSrc: "/report-assets/icon-email.svg",
    phoneSrc: "/report-assets/icon-phone.svg",
  },
  sidebarText: "MAA GAYATRI PATH LAB",
  footerLines: [
    "Hematology  •  Biochemistry  •  Immunoassay  •  Serology  •  Clinical Pathology",
    "In front Of Police Station, Arang, Raipur, Chhattisgarh   |   +91-9340638661   |   maagaytripatholgylab2006@gmail.com",
  ],
  // verifyBaseUrl: "https://your-domain/verify/",  // set when an online verify page exists
  // upiId: "yourname@bank",                          // set to print a "scan to pay" UPI QR on invoices
  invoiceTerms: [
    "Reports are released only after full payment.",
    "Please bring this invoice when collecting reports.",
  ],
};
