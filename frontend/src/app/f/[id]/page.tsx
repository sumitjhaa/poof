'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { downloadFile } from '@/utils/api';
import { API_URL } from '@/config';
import { Card, Spinner, Icon } from '@/components';

export default function DownloadFile() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<'loading' | 'password' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [filename, setFilename] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  const fetchFile = useCallback(async (pwd?: string) => {
    try {
      const result = await downloadFile(id, pwd);
      setFilename(result.filename);
      setFileSize(result.blob.size);

      // Auto-download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setStatus('ready');
    } catch (err) {
      if (err instanceof Error && err.message === 'password_required') {
        setStatus('password');
      } else {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Failed to download file');
      }
    }
  }, [id]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  // Mark as viewed when tab closes
  useEffect(() => {
    if (status !== 'ready') return;

    const storageKey = `poof-file-viewed-${id}`;

    const handleBeforeUnload = () => {
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1');
        const url = `${API_URL}/api/files/${id}/viewed`;
        navigator.sendBeacon(url, new Blob([], { type: 'text/plain' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, status]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await fetchFile(password);
  };

  const handleRetry = async () => {
    setStatus('loading');
    setDownloaded(false);
    await fetchFile(password || undefined);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="app">
      <Card>
        {status === 'loading' && (
          <div className="loading">
            <Spinner size="lg" />
          </div>
        )}

        {status === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <Icon type="warning" />
            <h2 className="section-title section-title-center">Password Required</h2>
            <p className="subtitle subtitle-spaced">
              This file is password protected
            </p>
            <div className="form-group">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={!password}>
              Unlock File
            </button>
          </form>
        )}

        {status === 'ready' && (
          <>
            <Icon type="success" />
            <h2 className="section-title section-title-center">File Downloaded</h2>
            <p className="subtitle subtitle-spaced">
              This file has been consumed and cannot be downloaded again
            </p>
            <div className="secret-box">
              <pre>{filename}{fileSize > 0 ? ` (${formatSize(fileSize)})` : ''}</pre>
            </div>
            <div className="form-actions-right">
              {downloaded && (
                <button className="btn btn-secondary" onClick={handleRetry}>
                  Re-download
                </button>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <Icon type="error" />
            <h2 className="section-title section-title-center">File Not Found</h2>
            <p className="subtitle subtitle-spaced">{errorMsg}</p>
          </>
        )}
      </Card>
    </div>
  );
}
