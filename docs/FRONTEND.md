# Frontend Documentation

## Overview

Next.js 14 web application for Poof secure secret sharing.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home - Create secret
│   │   ├── globals.css             # Global styles
│   │   ├── s/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Read secret page
│   │   ├── upload/
│   │   │   ├── page.tsx            # Upload file page
│   │   │   └── page.module.css
│   │   ├── api-keys/
│   │   │   ├── page.tsx            # API key management
│   │   │   └── page.module.css
│   │   └── audit/
│   │       ├── page.tsx            # Audit log viewer
│   │       └── page.module.css
│   ├── components/
│   │   ├── index.ts                # Component exports
│   │   ├── Box.tsx                 # Polymorphic layout
│   │   ├── Button.tsx              # Button component
│   │   ├── Card.tsx                # Card container
│   │   ├── Countdown.tsx           # Expiry countdown
│   │   ├── CopyButton.tsx          # Copy to clipboard
│   │   ├── FormElements.tsx        # Input, Textarea, Select
│   │   ├── Header.tsx              # App header
│   │   ├── Footer.tsx              # App footer
│   │   ├── Icon.tsx                # SVG icons
│   │   ├── SecretDisplay.tsx       # Secret display
│   │   └── Spinner.tsx             # Loading spinner
│   ├── utils/
│   │   ├── index.ts                # Utility exports
│   │   ├── api.ts                  # API client functions
│   │   └── crypto.ts               # WebCrypto encryption
│   └── styles/
│       └── globals.css             # CSS modules
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Pages

### Home Page (`/`)

**Purpose**: Create new secrets

**Features**:
- Textarea for secret input
- Expiry selector (5m, 1h, 1d, 7d)
- Max views selector (1, 3, 5, 10)
- Password protection checkbox
- Webhook URL input
- Success state with copy link

**Flow**:
1. User enters secret text
2. Selects expiry and views
3. Optional: Adds password/webhook
4. Clicks "Create Secret"
5. Frontend generates AES-256-GCM key
6. Frontend encrypts secret locally
7. Frontend sends encrypted data to API
8. API stores encrypted data, returns ID
9. Frontend displays full URL with key in fragment

### Read Secret Page (`/s/[id]`)

**Purpose**: Read and decrypt secrets

**Features**:
- Auto-fetches encrypted data
- Decrypts using key from URL fragment
- Displays secret with copy button
- Shows expiry countdown
- Handles password-protected secrets
- Handles expired/consumed states

### Upload Page (`/upload`)

**Purpose**: Upload files securely

**Features**:
- File picker
- Expiry selector
- Max views selector
- Upload progress
- Success state with download link

### API Keys Page (`/api-keys`)

**Purpose**: Manage API keys

**Features**:
- Create new API keys
- List existing keys
- Revoke compromised keys
- Rate limit configuration

### Audit Page (`/audit`)

**Purpose**: View audit logs

**Features**:
- Statistics overview
- Filterable log table
- Export to JSON/CSV
- Event type badges

## Components

### Box

```tsx
<Box as="div" p={4} bg="surface">
  Content
</Box>
```

Polymorphic layout component. Accepts `as` prop for element type.

### Button

```tsx
<Button variant="primary" loading={false} onClick={handler}>
  Click me
</Button>
```

**Variants**: `primary`, `secondary`
**Props**: `loading`, `disabled`, `onClick`

### Card

```tsx
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

Container with background, border, and shadow.

### Countdown

```tsx
<Countdown expiresAt="2024-01-01T00:00:00Z" onExpire={handler} />
```

Real-time countdown to expiry. Changes color when urgent.

### CopyButton

```tsx
<CopyButton text="text to copy" />
```

Copies text to clipboard with visual feedback.

### Spinner

```tsx
<Spinner />
```

Loading indicator.

## Utils

### api.ts

```typescript
// Create secret
createSecret(encryptedData, expiresIn, maxViews, passwordHash?, passwordSalt?, webhookUrl?)

// Read secret
readSecret(id, password?)

// Upload file
uploadFile(file, expiresIn, maxViews)
```

### crypto.ts

```typescript
// Generate AES-256-GCM key
generateKey(): Promise<CryptoKey>

// Encrypt plaintext
encrypt(key, plaintext): Promise<string>

// Decrypt ciphertext
decrypt(key, ciphertext): Promise<string>

// Encode key for URL
encodeKey(key): Promise<string>

// Decode key from URL
decodeKey(encoded): Promise<CryptoKey>

// Hash password with PBKDF2
hashPassword(password): Promise<{hash, salt}>
```

## CSS

Uses CSS Modules for component-scoped styling.

**Variables**:
- `--primary`: Primary color
- `--bg`: Background
- `--text`: Text color
- `--border`: Border color
- `--radius`: Border radius

**Responsive**: Mobile-first design with breakpoints.
