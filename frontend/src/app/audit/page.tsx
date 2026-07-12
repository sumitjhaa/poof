'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@/components';
import { useToast } from '@/components/Toast';
import { fetchAuditEntries, fetchAuditStats, exportAuditLogs, AuditEntry } from '@/utils/api';

const EVENT_META: Record<string, { label: string; color: string; bg: string; type: string }> = {
  'secret.created':  { label: 'Created',   color: 'var(--success)', bg: 'var(--success-muted)', type: 'Secret' },
  'secret.read':     { label: 'Read',      color: 'var(--info)',    bg: 'var(--info-muted)',    type: 'Secret' },
  'secret.deleted':  { label: 'Deleted',   color: 'var(--error)',   bg: 'var(--error-muted)',   type: 'Secret' },
  'secret.expired':  { label: 'Expired',   color: 'var(--error)',   bg: 'var(--error-muted)',   type: 'Secret' },
  'file.uploaded':   { label: 'Uploaded',  color: 'var(--success)', bg: 'var(--success-muted)', type: 'File' },
  'file.downloaded': { label: 'Downloaded',color: 'var(--info)',    bg: 'var(--info-muted)',    type: 'File' },
  'apikey.created':  { label: 'Key Created', color: 'var(--success)', bg: 'var(--success-muted)', type: 'Key' },
  'apikey.revoked':  { label: 'Key Revoked', color: 'var(--error)',   bg: 'var(--error-muted)',   type: 'Key' },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isToday) return time;
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} ${time}`;
}

export default function AuditPage() {
  const { addToast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byEvent: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        fetchAuditEntries(),
        fetchAuditStats(),
      ]);
      setEntries(entriesData);
      setStats({ total: statsData.total_events, byEvent: statsData.by_event });
    } catch {
      addToast('error', 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const text = await exportAuditLogs(format);
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
    ? entries.filter((e) => e.event.includes(filter) || (e.ip_address || '').includes(filter) || (e.location || '').includes(filter))
    : entries;

  return (
    <div className="app">
      <Card>
        <div className="card-header">
          <div>
            <h2 className="section-title">Audit Log</h2>
            <p className="subtitle">Track secret lifecycle and activity</p>
          </div>
          <div className="form-actions-right">
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('json')}>JSON</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}>CSV</button>
          </div>
        </div>

        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            {Object.entries(stats.byEvent).slice(0, 4).map(([event, count]) => {
              const meta = EVENT_META[event];
              return (
                <div key={event} className="stat">
                  <div className="stat-value" style={{ color: meta?.color || 'var(--text)' }}>
                    {count}
                  </div>
                  <div className="stat-label">{meta?.label || event}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="filter">
          <input
            className="input"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event, IP, or location..."
          />
        </div>

        {loading ? (
          <div className="loading"><Spinner /></div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty">No audit entries found</div>
        ) : (
          <div>
            <div className="audit-header">
              <span>Event</span>
              <span>Time</span>
              <span>IP</span>
              <span>Location</span>
            </div>
            {filteredEntries.map((entry) => {
              const meta = EVENT_META[entry.event];
              return (
                <div
                  key={entry.id}
                  className="audit-row"
                  style={{ background: meta?.bg || 'transparent' }}
                >
                  <span style={{ color: meta?.color || 'var(--text)', fontWeight: 600, fontSize: '0.75rem' }}>
                    {meta?.type} {meta?.label || entry.event}
                  </span>
                  <span className="table-cell-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="table-cell-mono">{entry.ip_address || '—'}</span>
                  <span className="table-cell">{entry.location || '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
