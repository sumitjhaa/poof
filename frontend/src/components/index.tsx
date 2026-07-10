'use client';

import { ReactNode } from 'react';

export function Spinner({ size = 'default' }: { size?: 'default' | 'lg' }) {
  return <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card fade-in ${className}`}>{children}</div>;
}

export function Header() {
  return (
    <div className="header">
      <h1>Poof</h1>
      <p>Share secrets securely. One-time access.</p>
    </div>
  );
}

export function Footer() {
  return (
    <div className="footer">
      <p>Encrypted in your browser. The server never sees plaintext.</p>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <button className="btn btn-primary" onClick={handleCopy}>
      Copy to Clipboard
    </button>
  );
}

export function SecretDisplay({ secret }: { secret: string }) {
  return (
    <div className="secret-box">
      <p className="label">Your secret</p>
      <pre>{secret}</pre>
    </div>
  );
}

export function Icon({ type }: { type: 'success' | 'error' | 'warning' }) {
  const className = `icon icon-${type}`;

  if (type === 'success') {
    return (
      <div className={className}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className={className}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  );
}
