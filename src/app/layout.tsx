import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Caveat, DM_Sans, Playfair_Display } from 'next/font/google';

export const metadata: Metadata = {
  title: {
    default: 'Visua AI',
    template: '%s · Visua AI',
  },
  description: 'Every concept is visual. We draw it for you with step-by-step chalkboard lessons.',
};

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontClasses = `${playfair.variable} ${dmSans.variable} ${caveat.variable} ${dmSans.className}`;

  return (
    <html lang="en" className={fontClasses}>
      <body className="app-body-root">{children}</body>
    </html>
  );
}
