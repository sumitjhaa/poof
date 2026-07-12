'use client';

import { useState } from 'react';
import { Card, Spinner, CopyButton } from '@/components';
import { uploadFile } from '@/utils/api';
import { hashPassword } from '@/utils/crypto';
import { useToast } from '@/components/Toast';

export default function UploadPage() {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState('1h');
  const [views, setViews] = useState(1);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
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
      let passwordHash: string | undefined;
      let passwordSalt: string | undefined;

      if (usePassword && password) {
        const { hash, salt } = await hashPassword(password);
        passwordHash = hash;
        passwordSalt = salt;
      }

      const data = await uploadFile(file, expires, views, passwordHash, passwordSalt);
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
            <div className="input-group">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

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
