import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Vision — Visual Math Intuition",
  description: "Understand math through animated chalk drawings. Visual intuition, one step at a time.",
  openGraph: {
    title: "Vision — Visual Math Intuition",
    description: "Understand math through animated chalk drawings. Visual intuition, one step at a time.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Vision — Visual Math Intuition",
    description: "Understand math through animated chalk drawings. Visual intuition, one step at a time.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
