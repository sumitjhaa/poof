'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Spinner } from '@/components';
import styles from './page.module.css';

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
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (err) {
      console.error('Failed to create key:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await fetch(`${API_URL}/api/keys/${keyId}`, {
        method: 'DELETE',
      });
      fetchKeys();
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
    }
  };

  if (newKey) {
    return (
      <div className={styles.container}>
        <Card>
          <h2 className={styles.title}>API Key Created!</h2>
          <div className={styles.newKey}>
            <p className={styles.label}>Your API Key:</p>
            <code className={styles.key}>{newKey}</code>
          </div>
          <p className={styles.warning}>
            Copy this key now - it will not be shown again!
          </p>
          <div className={styles.actions}>
            <Button onClick={copyKey}>Copy Key</Button>
            <Button variant="secondary" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card>
        <h2 className={styles.title}>API Keys</h2>
        <p className={styles.subtitle}>Manage API keys for third-party integration</p>

        <div className={styles.createForm}>
          <div className={styles.formRow}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name"
              className={styles.input}
            />
            <select
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              className={styles.select}
            >
              <option value={10}>10 req/hour</option>
              <option value={50}>50 req/hour</option>
              <option value={100}>100 req/hour</option>
              <option value={500}>500 req/hour</option>
            </select>
            <Button onClick={handleCreate} disabled={!name.trim() || creating}>
              {creating ? <Spinner /> : 'Create'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : keys.length === 0 ? (
          <p className={styles.empty}>No API keys yet</p>
        ) : (
          <div className={styles.keyList}>
            {keys.map((key) => (
              <div key={key.id} className={styles.keyItem}>
                <div className={styles.keyInfo}>
                  <span className={styles.keyName}>{key.name}</span>
                  <span className={styles.keyValue}>{key.key}</span>
                  <span className={styles.keyRate}>{key.rate_limit} req/hour</span>
                </div>
                <div className={styles.keyActions}>
                  <span
                    className={`${styles.status} ${
                      key.is_active ? styles.active : styles.inactive
                    }`}
                  >
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {key.is_active && (
                    <Button
                      variant="secondary"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
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
