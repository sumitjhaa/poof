'use client';

import { useState } from 'react';
import { Card, Button, Spinner } from '@/components';
import { uploadFile } from '@/utils/api';
import styles from './page.module.css';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState('1h');
  const [views, setViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await uploadFile(file, expires, views);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result) {
      navigator.clipboard.writeText(result.url);
    }
  };

  if (result) {
    return (
      <div className={styles.container}>
        <Card>
          <h2 className={styles.title}>File Uploaded!</h2>
          <div className={styles.result}>
            <p className={styles.label}>Share this link:</p>
            <code className={styles.url}>{result.url}</code>
          </div>
          <Button onClick={copyLink}>Copy Link</Button>
          <Button variant="secondary" onClick={() => setResult(null)}>
            Upload Another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card>
        <h2 className={styles.title}>Upload File</h2>
        <p className={styles.subtitle}>Share files securely with end-to-end encryption</p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Select File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Expires In</label>
          <select
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className={styles.select}
          >
            <option value="5m">5 minutes</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Max Views</label>
          <select
            value={views}
            onChange={(e) => setViews(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value={1}>1 view</option>
            <option value={3}>3 views</option>
            <option value={5}>5 views</option>
            <option value={10}>10 views</option>
          </select>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button onClick={handleUpload} disabled={loading || !file}>
          {loading ? <Spinner /> : 'Upload File'}
        </Button>
      </Card>
    </div>
  );
}
