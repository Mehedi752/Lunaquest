import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'LunaQuest — Junior Astronaut Mission Trainer', template: '%s · LunaQuest' },
  description: 'Build a lunar outpost, protect your crew, and master the engineering trade-offs of living beyond Earth. An educational simulation for the NASA Space Apps Challenge 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Scroll reveals never fire without JS, so show their finished state instead of blank sections. */}
        <noscript><style>{'.lq-rv{opacity:1!important;transform:none!important}'}</style></noscript>
      </head>
      <body className="min-h-screen font-sans">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
