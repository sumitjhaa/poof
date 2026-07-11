'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@/components';
import { useToast } from '@/components/Toast';
import { fetchAPIKeys, createAPIKey, revokeAPIKey, APIKeyItem } from '@/utils/api';

export default function APIKeysPage() {
  const { addToast } = useToast();
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const data = await fetchAPIKeys();
      setKeys(data);
    } catch {
      addToast('error', 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const data = await createAPIKey(name, rateLimit);
      setNewKey(data.key);
      setName('');
      loadKeys();
      addToast('success', 'API key created');
    } catch {
      addToast('error', 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeAPIKey(keyId);
      loadKeys();
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
          <h2 className="section-title section-title-center">API Key Created</h2>
          <div className="new-key-display">
            <p className="label">Your API Key</p>
            <code>{newKey}</code>
          </div>
          <p className="warning-text">Copy this key now — it will not be shown again</p>
          <div className="form-actions-right">
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
        <p className="subtitle subtitle-block">
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
              className="select select-compact"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
            >
              <option value={10}>10/hr</option>
              <option value={50}>50/hr</option>
              <option value={100}>100/hr</option>
              <option value={500}>500/hr</option>
            </select>
            <button
              className="btn btn-primary btn-sm btn-auto"
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
