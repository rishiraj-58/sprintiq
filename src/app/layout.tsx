import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { AIChatFloating } from '@/components/ai/AIChatFloating';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SprintIQ',
  description: 'Modern Project Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <main className="min-h-screen bg-background">
            {children}
            {/* Global AI assistant floating widget */}
            <AIChatFloating />
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
