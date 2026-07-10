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

export async function createSecret(
  encryptedData: string,
  expiresIn: number = 3600,
  maxViews: number = 1,
  passwordHash?: string,
  passwordSalt?: string
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
