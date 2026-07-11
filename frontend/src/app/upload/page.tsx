'use client';

import { useState } from 'react';
import { Card, Spinner, CopyButton } from '@/components';
import { uploadFile } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function UploadPage() {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState('1h');
  const [views, setViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; id: string } | null>(null);

  const handleUpload = async () => {
    if (!file) {
      addToast('error', 'Please select a file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('error', 'File exceeds 10MB limit');
      return;
    }

    setLoading(true);
    try {
      const data = await uploadFile(file, expires, views);
      setResult(data);
      addToast('success', 'File uploaded successfully');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="app">
        <Card>
          <h2 className="section-title section-title-center">File Uploaded</h2>
          <div className="result-box">
            <p className="label">Share this link</p>
            <code>{result.url}</code>
          </div>
          <CopyButton text={result.url} />
          <button
            className="btn btn-secondary result-actions"
            onClick={() => setResult(null)}
          >
            Upload Another
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="app">
      <Card>
        <h2 className="section-title">Upload File</h2>
        <p className="subtitle subtitle-block">
          Share files securely with end-to-end encryption
        </p>

        <div className="form-group">
          <label className="label">Select File</label>
          <div className="file-dropzone">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Expires In</label>
            <select
              className="select"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            >
              <option value="5m">5 minutes</option>
              <option value="1h">1 hour</option>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Max Views</label>
            <select
              className="select"
              value={views}
              onChange={(e) => setViews(parseInt(e.target.value))}
            >
              <option value={1}>1 view</option>
              <option value={3}>3 views</option>
              <option value={5}>5 views</option>
              <option value={10}>10 views</option>
            </select>
          </div>
        </div>

        <div className="form-actions-right">
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? <Spinner /> : 'Upload File'}
          </button>
        </div>
      </Card>
    </div>
  );
}
