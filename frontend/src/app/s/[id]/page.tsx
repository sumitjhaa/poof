"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { decodeKey, decrypt } from "@/utils/crypto";
import { readSecret } from "@/utils/api";
import { Card, Button, Input, Spinner, Icon, SecretDisplay, Header, CopyButton } from "@/components";

export default function ReadSecret() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<"loading" | "password" | "success" | "error">("loading");
  const [secret, setSecret] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");

  const fetchSecret = async (pwd?: string) => {
    const hash = window.location.hash;
    if (!hash.startsWith("#key=")) {
      setStatus("error");
      setErrorMsg("Invalid link - missing key");
      return;
    }

    const keyB64 = hash.slice(5);
    const key = decodeKey(keyB64);

    try {
      const data = await readSecret(id, pwd);

      if (!pwd && data.has_password) {
        setStatus("password");
        return;
      }

      const decrypted = await decrypt(key, data.encrypted_data);
      setSecret(decrypted);
      setStatus("success");
    } catch (err) {
      if (err instanceof Error && err.message === "password_required") {
        setStatus("password");
      } else {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Failed to decrypt secret");
      }
    }
  };

  useEffect(() => {
    fetchSecret();
  }, [id]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    await fetchSecret(password);
  };

  return (
    <div className="container">
      <Header />
      <Card>
        {status === "loading" && (
          <>
            <Spinner />
            <p style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
              Decrypting secret...
            </p>
          </>
        )}

        {status === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <Icon type="warning" />
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Password Required</h2>
            <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
              This secret is password protected
            </p>
            <div className="form-group">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
            <Button type="submit" disabled={!password}>
              Unlock Secret
            </Button>
          </form>
        )}

        {status === "success" && (
          <>
            <Icon type="success" />
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Secret Revealed</h2>
            <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              This secret has been consumed and cannot be viewed again
            </p>
            <SecretDisplay secret={secret} />
            <CopyButton text={secret} />
          </>
        )}

        {status === "error" && (
          <>
            <Icon type="error" />
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Secret Not Found</h2>
            <p style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>{errorMsg}</p>
          </>
        )}
      </Card>
    </div>
  );
}
