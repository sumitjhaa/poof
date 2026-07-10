'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@/components';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface APIKey {
  id: string;
  key: string;
  name: string;
  created_at: string;
  rate_limit: number;
  is_active: boolean;
}

export default function APIKeysPage() {
  const { addToast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/keys/`);
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      addToast('error', 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/keys/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rate_limit: rateLimit }),
      });

      const data = await res.json();
      setNewKey(data.key);
      setName('');
      fetchKeys();
      addToast('success', 'API key created');
    } catch {
      addToast('error', 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await fetch(`${API_URL}/api/keys/${keyId}`, { method: 'DELETE' });
      fetchKeys();
      addToast('success', 'API key revoked');
    } catch {
      addToast('error', 'Failed to revoke API key');
    }
  };

  const copyKey = () => {
    if (newKey) navigator.clipboard.writeText(newKey);
  };

  if (newKey) {
    return (
      <div className="app">
        <Card>
          <h2 className="section-title" style={{ textAlign: 'center' }}>API Key Created</h2>
          <div className="new-key-display">
            <p className="label">Your API Key</p>
            <code>{newKey}</code>
          </div>
          <p className="warning-text">Copy this key now — it will not be shown again</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={copyKey}>Copy Key</button>
            <button className="btn btn-secondary" onClick={() => setNewKey(null)}>Done</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="app">
      <Card>
        <h2 className="section-title">API Keys</h2>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
          Manage API keys for third-party integration
        </p>

        <div className="form-group">
          <div className="input-group">
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name"
            />
            <select
              className="select"
              style={{ width: 'auto', minWidth: '8rem' }}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
            >
              <option value={10}>10/hr</option>
              <option value={50}>50/hr</option>
              <option value={100}>100/hr</option>
              <option value={500}>500/hr</option>
            </select>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: 'auto', flexShrink: 0 }}
              onClick={handleCreate}
              disabled={!name.trim() || creating}
            >
              {creating ? <Spinner /> : 'Create'}
            </button>
          </div>
        </div>

        <div className="divider" />

        {loading ? (
          <div className="loading"><Spinner /></div>
        ) : keys.length === 0 ? (
          <div className="empty">No API keys yet</div>
        ) : (
          <div className="key-list">
            {keys.map((key) => (
              <div key={key.id} className="key-item">
                <div className="key-info">
                  <span className="key-name">{key.name}</span>
                  <span className="key-value">{key.key}</span>
                  <span className="key-meta">{key.rate_limit} req/hour</span>
                </div>
                <div className="key-actions">
                  <span className={`badge ${key.is_active ? 'badge-success' : 'badge-error'}`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {key.is_active && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
