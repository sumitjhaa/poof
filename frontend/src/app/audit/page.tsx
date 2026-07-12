'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@/components';
import { useToast } from '@/components/Toast';
import { fetchAuditEntries, fetchAuditStats, exportAuditLogs, AuditEntry } from '@/utils/api';

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
    ? entries.filter((e) => e.event.includes(filter) || e.resource_type.includes(filter) || (e.location || '').includes(filter))
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
            placeholder="Filter by event, type, or location..."
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
              <span>Location</span>
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
                <span className="table-cell">{entry.location || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
