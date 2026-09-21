import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Futura | Spec-Grade Architectural Surface Materials",
  description:
    "Premium architectural surface materials — corrugated metals, ACM panels, HPL laminates — delivered in 5–15 business days with a 15-year warranty. Request spec sheets & pricing in 24h.",
  keywords: [
    "architectural panels",
    "ACM panels",
    "corrugated metal",
    "HPL laminates",
    "perforated metal facade",
    "expanded metal",
    "facade materials",
    "building cladding",
  ],
  openGraph: {
    title: "Futura | Spec-Grade Architectural Surface Materials",
    description:
      "Spec-grade panels delivered in 5–15 days with a 15-year warranty. 50+ finishes, CNC custom sizing, 30+ countries.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Futura | Architectural Surface Materials",
    description:
      "Premium ACM, corrugated metal & HPL panels. Ships in 5–15 days. 15-year warranty. Get spec sheets in 24h.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
