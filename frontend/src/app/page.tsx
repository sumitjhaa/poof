"use client";

import { useState } from "react";
import { generateKey, encrypt, encodeKey, hashPassword } from "@/utils/crypto";
import { createSecret } from "@/utils/api";
import { Card, Button, Textarea, Select, Header, Footer, CopyButton } from "@/components";

const EXPIRY_OPTIONS = [
  { value: 300, label: "5 minutes" },
  { value: 3600, label: "1 hour" },
  { value: 86400, label: "1 day" },
  { value: 604800, label: "7 days" },
];

const VIEW_OPTIONS = [
  { value: 1, label: "1 view" },
  { value: 3, label: "3 views" },
  { value: 5, label: "5 views" },
  { value: 10, label: "10 views" },
];

export default function Home() {
  const [secret, setSecret] = useState("");
  const [expiresIn, setExpiresIn] = useState(3600);
  const [maxViews, setMaxViews] = useState(1);
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);

  const handleCreate = async () => {
    if (!secret.trim()) return;

    setLoading(true);
    try {
      const key = generateKey();
      const encrypted = await encrypt(key, secret);

      let passwordHash: string | undefined;
      let passwordSalt: string | undefined;

      if (usePassword && password) {
        const { hash, salt } = await hashPassword(password);
        passwordHash = hash;
        passwordSalt = salt;
      }

      const response = await createSecret(encrypted, expiresIn, maxViews, passwordHash, passwordSalt);
      const keyEncoded = encodeKey(key);
      const fullUrl = `${window.location.origin}/s/${response.id}#key=${keyEncoded}`;

      setResult({ url: fullUrl });
    } catch {
      alert("Failed to create secret");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="container">
        <Header />
        <Card>
          <div className="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Secret Created!</h2>
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Share this link before it expires
          </p>
          <div className="secret-box">
            <p>Your secure link:</p>
            <pre>{result.url}</pre>
          </div>
          <CopyButton text={result.url} />
          <Button variant="secondary" onClick={() => { setResult(null); setSecret(""); }}>
            Create Another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      <Card>
        <h2 style={{ marginBottom: "1rem" }}>Create a Secret</h2>
        <Textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter your secret..."
        />
        <div className="form-row">
          <div className="form-group">
            <label>Expires in</label>
            <Select
              options={EXPIRY_OPTIONS}
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Max views</label>
            <Select
              options={VIEW_OPTIONS}
              value={maxViews}
              onChange={(e) => setMaxViews(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="usePassword"
            checked={usePassword}
            onChange={(e) => setUsePassword(e.target.checked)}
          />
          <label htmlFor="usePassword">Password protect this secret</label>
        </div>
        {usePassword && (
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
            />
          </div>
        )}
        <Button onClick={handleCreate} disabled={!secret.trim() || loading} loading={loading}>
          Create Secret
        </Button>
      </Card>
      <Footer />
    </div>
  );
}
