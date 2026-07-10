'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/Toast';
import KeepAlive from '@/components/KeepAlive';
import Link from 'next/link';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <KeepAlive />
        <ThemeToggle />
        <nav className="nav" style={{ paddingTop: '1rem' }}>
          <Link href="/" className="nav-link">Create</Link>
          <Link href="/upload" className="nav-link">Upload</Link>
          <Link href="/api-keys" className="nav-link">API Keys</Link>
          <Link href="/audit" className="nav-link">Audit</Link>
        </nav>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
