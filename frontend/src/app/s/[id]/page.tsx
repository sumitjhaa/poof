'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { decodeKey, decrypt } from '@/utils/crypto';
import { readSecret } from '@/utils/api';
import { Card, Spinner, Icon, SecretDisplay, CopyButton } from '@/components';

export default function ReadSecret() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<'loading' | 'password' | 'success' | 'error'>('loading');
  const [secret, setSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchSecret = useCallback(async (pwd?: string) => {
    const hash = window.location.hash;
    if (!hash.startsWith('#key=')) {
      setStatus('error');
      setErrorMsg('Invalid link - missing key');
      return;
    }

    const keyB64 = hash.slice(5);
    const key = decodeKey(keyB64);

    try {
      const data = await readSecret(id, pwd);

      if (!pwd && data.has_password) {
        setStatus('password');
        return;
      }

      const decrypted = await decrypt(key, data.encrypted_data);
      setSecret(decrypted);
      setStatus('success');
    } catch (err) {
      if (err instanceof Error && err.message === 'password_required') {
        setStatus('password');
      } else {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Failed to decrypt secret');
      }
    }
  }, [id]);

  useEffect(() => {
    fetchSecret();
  }, [fetchSecret]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await fetchSecret(password);
  };

  return (
    <div className="app">
      <Card>
        {status === 'loading' && (
          <div className="loading">
            <Spinner size="lg" />
          </div>
        )}

        {status === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <Icon type="warning" />
            <h2 className="section-title section-title-center">Password Required</h2>
            <p className="subtitle subtitle-spaced">
              This secret is password protected
            </p>
            <div className="form-group">
              <div className="input-group">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!password}>
              Unlock Secret
            </button>
          </form>
        )}

        {status === 'success' && (
          <>
            <Icon type="success" />
            <h2 className="section-title section-title-center">Secret Revealed</h2>
            <p className="subtitle subtitle-spaced">
              This secret has been consumed and cannot be viewed again
            </p>
            <SecretDisplay secret={secret} />
            <CopyButton text={secret} />
          </>
        )}

        {status === 'error' && (
          <>
            <Icon type="error" />
            <h2 className="section-title section-title-center">Secret Not Found</h2>
            <p className="subtitle subtitle-spaced">{errorMsg}</p>
          </>
        )}
      </Card>
    </div>
  );
}
