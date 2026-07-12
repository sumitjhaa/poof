import { API_URL } from '@/config';

export interface SecretCreateResponse {
  id: string;
  created_at: string;
  expires_at: string;
  url: string;
}

export interface SecretReadResponse {
  id: string;
  encrypted_data: string;
  created_at: string;
  expires_at: string;
  views_remaining: number;
  has_password: boolean;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  created_at: string;
  expires_at: string;
  url: string;
}

export async function createSecret(
  encryptedData: string,
  expiresIn: number = 3600,
  maxViews: number = 1,
  passwordHash?: string,
  passwordSalt?: string,
  webhookUrl?: string
): Promise<SecretCreateResponse> {
  const res = await fetch(`${API_URL}/api/secrets/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encrypted_data: encryptedData,
      expires_in: expiresIn,
      max_views: maxViews,
      password_hash: passwordHash,
      password_salt: passwordSalt,
      webhook_url: webhookUrl,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to create secret");
  }

  return res.json();
}

export async function readSecret(
  id: string,
  password?: string
): Promise<SecretReadResponse> {
  const url = new URL(`${API_URL}/api/secrets/${id}`);
  if (password) {
    url.searchParams.set("password", password);
  }

  const res = await fetch(url.toString());

  if (res.status === 403) {
    throw new Error("password_required");
  }

  if (res.status === 404) {
    throw new Error("Secret not found or already consumed");
  }

  if (!res.ok) {
    throw new Error("Failed to read secret");
  }

  return res.json();
}

export async function downloadFile(
  id: string,
  password?: string
): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const url = new URL(`${API_URL}/api/files/${id}`);
  if (password) {
    url.searchParams.set("password", password);
  }

  const res = await fetch(url.toString());

  if (res.status === 403) {
    throw new Error("password_required");
  }

  if (res.status === 404) {
    throw new Error("File not found or already consumed");
  }

  if (!res.ok) {
    throw new Error("Failed to download file");
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : "download";
  const contentType = res.headers.get("Content-Type") || "application/octet-stream";

  const blob = await res.blob();
  return { blob, filename, contentType };
}

// ── API Keys ──

export interface APIKeyItem {
  id: string;
  key: string;
  name: string;
  created_at: string;
  rate_limit: number;
  is_active: boolean;
}

export async function fetchAPIKeys(): Promise<APIKeyItem[]> {
  const res = await fetch(`${API_URL}/api/keys/`);
  if (!res.ok) throw new Error("Failed to load API keys");
  const data = await res.json();
  return data.keys || [];
}

export async function createAPIKey(
  name: string,
  rateLimit: number
): Promise<{ key: string }> {
  const res = await fetch(`${API_URL}/api/keys/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rate_limit: rateLimit }),
  });
  if (!res.ok) throw new Error("Failed to create API key");
  return res.json();
}

export async function revokeAPIKey(keyId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/keys/${keyId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to revoke API key");
}

// ── Audit ──

export interface AuditEntry {
  id: string;
  event: string;
  resource_id: string;
  resource_type: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  location: string | null;
}

export interface AuditStats {
  total_events: number;
  by_event: Record<string, number>;
}

export async function fetchAuditEntries(limit = 100): Promise<AuditEntry[]> {
  const res = await fetch(`${API_URL}/api/audit/?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load audit entries");
  const data = await res.json();
  return data.entries || [];
}

export async function fetchAuditStats(): Promise<AuditStats> {
  const res = await fetch(`${API_URL}/api/audit/stats`);
  if (!res.ok) throw new Error("Failed to load audit stats");
  return res.json();
}

export async function exportAuditLogs(format: "json" | "csv"): Promise<string> {
  const res = await fetch(`${API_URL}/api/audit/export?format=${format}`);
  if (!res.ok) throw new Error("Failed to export logs");
  return res.text();
}

// ── File Upload ──

export async function uploadFile(
  file: File,
  expiresIn: string = "1h",
  maxViews: number = 1,
  passwordHash?: string,
  passwordSalt?: string,
): Promise<FileUploadResponse> {
  const expiryMap: Record<string, number> = {
    "5m": 300,
    "1h": 3600,
    "1d": 86400,
    "7d": 604800,
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("expires_in", String(expiryMap[expiresIn] || 3600));
  formData.append("max_views", String(maxViews));

  if (passwordHash) {
    formData.append("password_hash", passwordHash);
  }
  if (passwordSalt) {
    formData.append("password_salt", passwordSalt);
  }

  const res = await fetch(`${API_URL}/api/files/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload file");
  }

  return res.json();
}
