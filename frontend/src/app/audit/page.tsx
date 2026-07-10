'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Spinner } from '@/components';
import styles from './page.module.css';

interface AuditEntry {
  id: string;
  event: string;
  resource_id: string;
  resource_type: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byEvent: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/audit/?limit=100');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch audit entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/audit/stats');
      const data = await res.json();
      setStats({
        total: data.total_events,
        byEvent: data.by_event,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const res = await fetch(`http://localhost:8000/api/audit/export?format=${format}`);
      const text = await res.text();
      const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      'secret.created': 'Secret Created',
      'secret.read': 'Secret Read',
      'secret.deleted': 'Secret Deleted',
      'secret.expired': 'Secret Expired',
      'file.uploaded': 'File Uploaded',
      'file.downloaded': 'File Downloaded',
      'apikey.created': 'API Key Created',
      'apikey.revoked': 'API Key Revoked',
    };
    return labels[event] || event;
  };

  const getEventColor = (event: string) => {
    if (event.includes('created') || event.includes('uploaded')) return '#10b981';
    if (event.includes('read') || event.includes('downloaded')) return '#3b82f6';
    if (event.includes('deleted') || event.includes('expired') || event.includes('revoked')) return '#ef4444';
    return '#6b7280';
  };

  const filteredEntries = filter
    ? entries.filter(e => e.event.includes(filter) || e.resource_type.includes(filter))
    : entries;

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Audit Log</h2>
            <p className={styles.subtitle}>Track secret lifecycle and activity</p>
          </div>
          <div className={styles.exportButtons}>
            <Button variant="secondary" onClick={() => exportLogs('json')}>
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => exportLogs('csv')}>
              Export CSV
            </Button>
          </div>
        </div>

        {stats && (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total Events</span>
            </div>
            {Object.entries(stats.byEvent).slice(0, 4).map(([event, count]) => (
              <div key={event} className={styles.statItem}>
                <span className={styles.statValue}>{count}</span>
                <span className={styles.statLabel}>{getEventLabel(event)}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.filter}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event or type..."
            className={styles.filterInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : filteredEntries.length === 0 ? (
          <p className={styles.empty}>No audit entries found</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Timestamp</span>
              <span>Event</span>
              <span>Resource</span>
              <span>ID</span>
              <span>IP</span>
            </div>
            {filteredEntries.map((entry) => (
              <div key={entry.id} className={styles.tableRow}>
                <span className={styles.timestamp}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span
                  className={styles.eventBadge}
                  style={{ backgroundColor: getEventColor(entry.event) + '20', color: getEventColor(entry.event) }}
                >
                  {getEventLabel(entry.event)}
                </span>
                <span>{entry.resource_type}</span>
                <span className={styles.resourceId}>{entry.resource_id.slice(0, 8)}...</span>
                <span className={styles.ip}>{entry.ip_address || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
