'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/Toast';
import KeepAlive from '@/components/KeepAlive';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Create' },
  { href: '/upload', label: 'Upload' },
  { href: '/api-keys', label: 'API Keys' },
  { href: '/audit', label: 'Audit' },
];

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ThemeProvider>
      <ToastProvider>
        <KeepAlive />
        <nav className="nav">
          <Link href="/" className="nav-brand">
            <svg className="nav-icon" width="14" height="14" viewBox="-1 -1 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1H11V3H13C13.5523 3 14 3.44772 14 4C14 4.55228 13.5523 5 13 5H2V7H13C14.6569 7 16 5.65685 16 4C16 2.34315 14.6569 1 13 1Z" fill="currentColor"/>
              <path d="M0 11H11C11.5523 11 12 11.4477 12 12C12 12.5523 11.5523 13 11 13H9V15H11C12.6569 15 14 13.6569 14 12C14 10.3431 12.6569 9 11 9H0V11Z" fill="currentColor"/>
            </svg>
            Poof
          </Link>
          <div className="nav-links">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {isActive ? `// ${item.label}` : item.label}
                </Link>
              );
            })}
          </div>
          <ThemeToggle />
        </nav>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
