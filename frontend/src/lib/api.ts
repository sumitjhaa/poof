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
}

export async function createSecret(
  encryptedData: string,
  expiresIn: number = 3600,
  maxViews: number = 1
): Promise<SecretCreateResponse> {
  const res = await fetch(`${API_URL}/api/secrets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encrypted_data: encryptedData,
      expires_in: expiresIn,
      max_views: maxViews,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to create secret");
  }

  return res.json();
}

export async function readSecret(
  id: string
): Promise<SecretReadResponse> {
  const res = await fetch(`${API_URL}/api/secrets/${id}`);

  if (res.status === 404) {
    throw new Error("Secret not found or already consumed");
  }

  if (!res.ok) {
    throw new Error("Failed to read secret");
  }

  return res.json();
}
