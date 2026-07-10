"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { decodeKey, decrypt } from "@/lib/crypto";
import { readSecret } from "@/lib/api";

export default function ReadSecret() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSecret = async () => {
      // Get key from URL hash
      const hash = window.location.hash;
      if (!hash.startsWith("#key=")) {
        setStatus("error");
        setErrorMsg("Invalid link - missing key");
        return;
      }

      const keyB64 = hash.slice(5);
      const key = decodeKey(keyB64);

      try {
        const data = await readSecret(id);
        const decrypted = await decrypt(key, data.encrypted_data);
        setSecret(decrypted);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Failed to decrypt secret");
      }
    };

    fetchSecret();
  }, [id]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Poof</h1>
          <p className="text-gray-400">One-time secret delivery</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Decrypting secret...</p>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Secret Revealed</h2>
                <p className="text-gray-400 text-sm">This secret has been consumed and cannot be viewed again</p>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-2">Your secret:</p>
                <pre className="text-purple-300 font-mono text-sm whitespace-pre-wrap break-all">{secret}</pre>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Secret Not Found</h2>
              <p className="text-gray-400">{errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
