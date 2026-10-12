import type { LabProfile } from "./types";

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
    signatureHeaderSrc: "/report-assets/signature-scan.jpg",
    signatureNonHeaderSrc: "/report-assets/signature-green.png",
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
};
