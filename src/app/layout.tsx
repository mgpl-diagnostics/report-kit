import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MGPL Report Kit",
  description: "Maa Gayatri Path Lab — report preview and A4 PDF export",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
