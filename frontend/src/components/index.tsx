'use client';

import { ReactNode, useState } from 'react';

export function Spinner({ size = 'default' }: { size?: 'default' | 'lg' }) {
  return <div className={size === 'lg' ? 'spinner spinner-lg' : 'spinner'} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card fade-in ${className}`}>{children}</div>;
}

export function Footer() {
  return (
    <div className="footer">
      <p>Encrypted in your browser. The server never sees plaintext.</p>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button className={`btn btn-secondary copy-btn ${copied ? 'copy-btn--copied' : ''}`} onClick={handleCopy}>
      {copied ? (
        <>
          <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export function SecretDisplay({ secret }: { secret: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="secret-box">
      <pre className={revealed ? '' : 'secret-blurred'}>{secret}</pre>
      <button className="btn btn-ghost secret-reveal-btn" onClick={() => setRevealed(!revealed)}>
        {revealed ? (
          <>
            <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Hide
          </>
        ) : (
          <>
            <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Reveal
          </>
        )}
      </button>
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
