const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export async function uploadFile(
  file: File,
  expiresIn: string = "1h",
  maxViews: number = 1
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

  const res = await fetch(`${API_URL}/api/files/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload file");
  }

  return res.json();
}
