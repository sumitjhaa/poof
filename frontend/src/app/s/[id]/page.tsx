'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { decodeKey, decrypt } from '@/utils/crypto';
import { readSecret } from '@/utils/api';
import { Card, Spinner, Icon, SecretDisplay, Header, CopyButton } from '@/components';

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await fetchSecret(password);
  };

  return (
    <div className="app">
      <Header />
      <Card>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Spinner size="lg" />
            <p className="subtitle" style={{ marginTop: '1rem' }}>Decrypting secret...</p>
          </div>
        )}

        {status === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <Icon type="warning" />
            <h2 className="section-title" style={{ textAlign: 'center' }}>Password Required</h2>
            <p className="subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
            <h2 className="section-title" style={{ textAlign: 'center' }}>Secret Revealed</h2>
            <p className="subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              This secret has been consumed and cannot be viewed again
            </p>
            <SecretDisplay secret={secret} />
            <CopyButton text={secret} />
          </>
        )}

        {status === 'error' && (
          <>
            <Icon type="error" />
            <h2 className="section-title" style={{ textAlign: 'center' }}>Secret Not Found</h2>
            <p className="subtitle" style={{ textAlign: 'center' }}>{errorMsg}</p>
          </>
        )}
      </Card>
    </div>
  );
}
