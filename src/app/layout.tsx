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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
