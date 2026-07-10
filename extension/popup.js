// Popup script

const API_URL = "http://localhost:8000";

// DOM Elements
const createView = document.getElementById('create-view');
const resultView = document.getElementById('result-view');
const readView = document.getElementById('read-view');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

const secretInput = document.getElementById('secret');
const expiresSelect = document.getElementById('expires');
const viewsSelect = document.getElementById('views');
const createBtn = document.getElementById('create-btn');
const linkInput = document.getElementById('link');
const copyBtn = document.getElementById('copy-btn');
const newBtn = document.getElementById('new-btn');
const decryptedPre = document.getElementById('decrypted');
const copySecretBtn = document.getElementById('copy-secret-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if URL parameter exists (for reading)
  const params = new URLSearchParams(window.location.search);
  const url = params.get('url');
  if (url) {
    showReadView(url);
  }

  // Event listeners
  createBtn.addEventListener('click', handleCreate);
  copyBtn.addEventListener('click', handleCopy);
  newBtn.addEventListener('click', showCreateView);
  copySecretBtn.addEventListener('click', handleCopySecret);
});

// Create secret
async function handleCreate() {
  const text = secretInput.value.trim();
  if (!text) return;

  showLoading(true);
  hideError();

  try {
    // Generate key
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Encrypt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    // Export key
    const keyData = await crypto.subtle.exportKey("raw", key);
    const keyB64 = btoa(String.fromCharCode(...new Uint8Array(keyData)));

    // Convert to hex
    const encryptedHex = Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Send to API
    const response = await fetch(`${API_URL}/api/secrets/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encrypted_data: encryptedHex,
        expires_in: parseInt(expiresSelect.value),
        max_views: parseInt(viewsSelect.value)
      })
    });

    if (!response.ok) throw new Error("Failed to create secret");

    const data = await response.json();
    const fullUrl = `${API_URL}/s/${data.id}#key=${keyB64}`;

    linkInput.value = fullUrl;
    showResultView();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// Read secret
async function showReadView(url) {
  showLoading(true);
  hideError();

  try {
    // Parse URL
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const secretId = pathParts[pathParts.length - 1];
    const keyB64 = parsed.hash.replace('#key=', '');

    // Fetch secret
    const response = await fetch(`${API_URL}/api/secrets/${secretId}`);
    if (!response.ok) throw new Error("Secret not found or expired");

    const data = await response.json();

    // Decrypt
    const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const encryptedBytes = new Uint8Array(
      data.encrypted_data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(12) },
      key,
      encryptedBytes
    );

    const text = new TextDecoder().decode(decrypted);
    decryptedPre.textContent = text;
    showReadResultView();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// Copy link
async function handleCopy() {
  await navigator.clipboard.writeText(linkInput.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy", 2000);
}

// Copy secret
async function handleCopySecret() {
  await navigator.clipboard.writeText(decryptedPre.textContent);
  copySecretBtn.textContent = "Copied!";
  setTimeout(() => copySecretBtn.textContent = "Copy to Clipboard", 2000);
}

// View management
function showCreateView() {
  createView.classList.remove('hidden');
  resultView.classList.add('hidden');
  readView.classList.add('hidden');
  secretInput.value = '';
}

function showResultView() {
  createView.classList.add('hidden');
  resultView.classList.remove('hidden');
  readView.classList.add('hidden');
}

function showReadResultView() {
  createView.classList.add('hidden');
  resultView.classList.add('hidden');
  readView.classList.remove('hidden');
}

function showLoading(show) {
  loading.classList.toggle('hidden', !show);
}

function showError(message) {
  error.textContent = message;
  error.classList.remove('hidden');
}

function hideError() {
  error.classList.add('hidden');
}
