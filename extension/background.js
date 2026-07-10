// Background service worker

const API_URL = "http://localhost:8000";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "poof-create",
    title: "Share with Poof",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "poof-read",
    title: "Read with Poof",
    contexts: ["link"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "poof-create") {
    createSecret(info.selectionText);
  } else if (info.menuItemId === "poof-read") {
    readSecret(info.linkUrl);
  }
});

// Create secret
async function createSecret(text) {
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
        expires_in: 3600,
        max_views: 1
      })
    });

    const data = await response.json();
    const url = `${API_URL}/s/${data.id}#key=${keyB64}`;

    // Copy to clipboard
    await navigator.clipboard.writeText(url);

    // Show notification
    chrome.notifications.create({
      type: "basic",
      title: "Poof - Secret Created",
      message: "Link copied to clipboard!"
    });
  } catch (error) {
    console.error("Error creating secret:", error);
  }
}

// Read secret (opens popup)
function readSecret(url) {
  chrome.tabs.create({
    url: `popup.html?url=${encodeURIComponent(url)}`
  });
}
