"use client";

import { useState } from "react";
import { generateKey, encrypt, encodeKey } from "@/lib/crypto";
import { createSecret } from "@/lib/api";

export default function Home() {
  const [secret, setSecret] = useState("");
  const [expiresIn, setExpiresIn] = useState(3600);
  const [maxViews, setMaxViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!secret.trim()) return;

    setLoading(true);
    try {
      const key = generateKey();
      const encrypted = await encrypt(key, secret);
      const response = await createSecret(encrypted, expiresIn, maxViews);

      const keyEncoded = encodeKey(key);
      const fullUrl = `${window.location.origin}/s/${response.id}#key=${keyEncoded}`;

      setResult({
        url: fullUrl,
        expiresAt: response.expires_at,
      });
    } catch (err) {
      alert("Failed to create secret");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createAnother = () => {
    setSecret("");
    setResult(null);
    setCopied(false);
  };

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Secret Created!</h2>
              <p className="text-gray-400">Share this link before it expires</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Your secure link:</p>
              <p className="text-sm text-purple-300 break-all font-mono">{result.url}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <button
              onClick={createAnother}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Poof</h1>
          <p className="text-gray-400">Share secrets securely. One-time access.</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Create a Secret</h2>

          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your secret..."
            className="w-full h-32 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none mb-4"
          />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Expires in</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value={300}>5 minutes</option>
                <option value={3600}>1 hour</option>
                <option value={86400}>1 day</option>
                <option value={604800}>7 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Max views</label>
              <select
                value={maxViews}
                onChange={(e) => setMaxViews(Number(e.target.value))}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value={1}>1 view</option>
                <option value={3}>3 views</option>
                <option value={5}>5 views</option>
                <option value={10}>10 views</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!secret.trim() || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Secret"}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your secret is encrypted in your browser.</p>
          <p>The server never sees the plaintext.</p>
        </div>
      </div>
    </main>
  );
}
