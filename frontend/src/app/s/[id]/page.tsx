'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { decodeKey, decrypt } from '@/utils/crypto';
import { readSecret } from '@/utils/api';
import { API_URL } from '@/config';
import { Card, Spinner, Icon, SecretDisplay, CopyButton } from '@/components';

export default function ReadSecret() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<'loading' | 'password' | 'success' | 'error'>('loading');
  const [secret, setSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');

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

  // Mark as viewed when tab closes (not on page load/refresh)
  useEffect(() => {
    if (status !== 'success') return;

    const storageKey = `poof-viewed-${id}`;

    const handleBeforeUnload = () => {
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1');
        // Use sendBeacon for reliable delivery on tab close
        const url = `${API_URL}/api/secrets/${id}/viewed`;
        navigator.sendBeacon(url, new Blob([], { type: 'text/plain' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, status]);

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
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
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
