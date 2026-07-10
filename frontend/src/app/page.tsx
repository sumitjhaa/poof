'use client';

import { useState } from 'react';
import { generateKey, encrypt, encodeKey, hashPassword } from '@/utils/crypto';
import { createSecret } from '@/utils/api';
import { Card, Spinner, Header, Footer, CopyButton } from '@/components';
import { useToast } from '@/components/Toast';

const EXPIRY_OPTIONS = [
  { value: 300, label: '5 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '1 day' },
  { value: 604800, label: '7 days' },
];

const VIEW_OPTIONS = [
  { value: 1, label: '1 view' },
  { value: 3, label: '3 views' },
  { value: 5, label: '5 views' },
  { value: 10, label: '10 views' },
];

export default function Home() {
  const { addToast } = useToast();
  const [secret, setSecret] = useState('');
  const [expiresIn, setExpiresIn] = useState(3600);
  const [maxViews, setMaxViews] = useState(1);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [webhook, setWebhook] = useState('');
  const [useWebhook, setUseWebhook] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);

  const handleCreate = async () => {
    if (!secret.trim()) return;

    setLoading(true);
    try {
      const key = generateKey();
      const encrypted = await encrypt(key, secret);

      let passwordHash: string | undefined;
      let passwordSalt: string | undefined;

      if (usePassword && password) {
        const { hash, salt } = await hashPassword(password);
        passwordHash = hash;
        passwordSalt = salt;
      }

      const response = await createSecret(
        encrypted,
        expiresIn,
        maxViews,
        passwordHash,
        passwordSalt,
        useWebhook ? webhook : undefined
      );
      const keyEncoded = encodeKey(key);
      const fullUrl = `${window.location.origin}/s/${response.id}#key=${keyEncoded}`;

      setResult({ url: fullUrl });
      addToast('success', 'Secret created successfully');
    } catch {
      addToast('error', 'Failed to create secret');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="app">
        <Header />
        <Card>
          <div className="icon icon-success">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Secret Created</h2>
          <p className="subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Share this link before it expires
          </p>
          <div className="secret-box">
            <p className="label">Your secure link</p>
            <pre>{result.url}</pre>
          </div>
          <CopyButton text={result.url} />
          <button
            className="btn btn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => { setResult(null); setSecret(''); }}
          >
            Create Another
          </button>
        </Card>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <Card>
        <h2 className="section-title">Create a Secret</h2>
        <div className="form-group">
          <textarea
            className="textarea"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your secret..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Expires in</label>
            <select
              className="select"
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Max views</label>
            <select
              className="select"
              value={maxViews}
              onChange={(e) => setMaxViews(Number(e.target.value))}
            >
              {VIEW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
            />
            <span>Password protect</span>
          </label>
        </div>

        {usePassword && (
          <div className="form-group">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
            />
          </div>
        )}

        <div className="form-group">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={useWebhook}
              onChange={(e) => setUseWebhook(e.target.checked)}
            />
            <span>Notify on expiration</span>
          </label>
        </div>

        {useWebhook && (
          <div className="form-group">
            <input
              className="input"
              type="url"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              placeholder="https://your-webhook-url.com/notify"
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={!secret.trim() || loading}
        >
          {loading ? <Spinner /> : 'Create Secret'}
        </button>
      </Card>
      <Footer />
    </div>
  );
}
