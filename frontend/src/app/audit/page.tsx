'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@/components';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AuditEntry {
  id: string;
  event: string;
  resource_id: string;
  resource_type: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  'secret.created': 'Created',
  'secret.read': 'Read',
  'secret.deleted': 'Deleted',
  'secret.expired': 'Expired',
  'file.uploaded': 'Uploaded',
  'file.downloaded': 'Downloaded',
  'apikey.created': 'Key Created',
  'apikey.revoked': 'Key Revoked',
};

function getEventBadge(event: string) {
  if (event.includes('created') || event.includes('uploaded')) return 'badge-success';
  if (event.includes('read') || event.includes('downloaded')) return 'badge-info';
  return 'badge-error';
}

export default function AuditPage() {
  const { addToast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byEvent: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState('');

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/audit/?limit=100`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      addToast('error', 'Failed to load audit entries');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/audit/stats`);
      const data = await res.json();
      setStats({ total: data.total_events, byEvent: data.by_event });
    } catch {
      addToast('error', 'Failed to load stats');
    }
  }, [addToast]);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, [fetchEntries, fetchStats]);

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const res = await fetch(`${API_URL}/api/audit/export?format=${format}`);
      const text = await res.text();
      const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('error', 'Failed to export logs');
    }
  };

  const filteredEntries = filter
    ? entries.filter((e) => e.event.includes(filter) || e.resource_type.includes(filter))
    : entries;

  return (
    <div className="app">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="section-title">Audit Log</h2>
            <p className="subtitle">Track secret lifecycle and activity</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportLogs('json')}>JSON</button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportLogs('csv')}>CSV</button>
          </div>
        </div>

        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            {Object.entries(stats.byEvent).slice(0, 4).map(([event, count]) => (
              <div key={event} className="stat">
                <div className="stat-value">{count}</div>
                <div className="stat-label">{EVENT_LABELS[event] || event}</div>
              </div>
            ))}
          </div>
        )}

        <div className="filter">
          <input
            className="input"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event or type..."
          />
        </div>

        {loading ? (
          <div className="loading"><Spinner /></div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty">No audit entries found</div>
        ) : (
          <div>
            <div className="table-header">
              <span>Time</span>
              <span>Event</span>
              <span>Resource</span>
              <span>ID</span>
              <span>IP</span>
            </div>
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="table-row">
                <span className="table-cell-mono">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span>
                  <span className={`badge ${getEventBadge(entry.event)}`}>
                    {EVENT_LABELS[entry.event] || entry.event}
                  </span>
                </span>
                <span className="table-cell">{entry.resource_type}</span>
                <span className="table-cell-mono">{entry.resource_id.slice(0, 8)}...</span>
                <span className="table-cell-mono">{entry.ip_address || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
