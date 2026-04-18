# Architectural Blueprint: Post-Quantum Base58 Recovery Key

## 1. Executive Summary
This blueprint outlines the replacement of the 12-word mnemonic recovery phrase with a highly secure, post-quantum resilient **Base58 Encoded Recovery Key**. 

While 12-word mnemonics (128 bits of entropy) are secure against classical computers, they are theoretically vulnerable to Grover's algorithm in a post-quantum world. To achieve post-quantum security (requiring 256 bits of entropy) while maintaining human usability, we will generate a 256-bit key, append a cryptographic checksum to prevent typos, and encode it using Base58. Base58 removes visually ambiguous characters (like `0`, `O`, `I`, `l`). The final string will be formatted into readable chunks (e.g., `A1B2-C3D4-...`).

## 2. Dependency Matrix
- **Runtime/Framework:** Next.js (App Router), React, Web Crypto API
- **Dependencies Added:**
  - `bs58@6.0.0`: A lightweight, heavily audited library for Base58 encoding and decoding. Base58 is the standard used by Bitcoin to create human-readable, typo-resistant strings.

## 3. Data Models & Schemas
- No database schema changes are required. The API endpoint (`/api/auth/setup`) currently accepts an `entropyKey` string. We will update the frontend to derive the AES-256-GCM database key from this new Base58 string instead of the raw hex string, or we can send the raw decoded hex bytes to the backend to maintain API compatibility. 

## 4. System Architecture & Flow
1. **Entropy Generation:** Mouse movement + `window.crypto.getRandomValues()` are hashed via SHA-512 to produce 64 bytes (512 bits) of raw entropy.
2. **Key Extraction:** The first 32 bytes (256 bits) are extracted. This is our post-quantum secure master key.
3. **Checksum Generation:** We hash the 32 bytes using SHA-256 and take the first 4 bytes. 
4. **Concatenation:** The 4-byte checksum is appended to the 32-byte key, resulting in a 36-byte payload.
5. **Encoding:** The 36-byte payload is encoded using Base58.
6. **Formatting:** The resulting Base58 string (approximately 49-50 characters) is split into chunks of 5 characters separated by hyphens (e.g., `XyZ12-3aBcD-...`) for easy reading and transcription.
7. **Verification:** When a user enters the key for recovery, the system removes hyphens, decodes the Base58 string to 36 bytes, separates the 32-byte key from the 4-byte checksum, and verifies that the SHA-256 hash of the 32-byte key matches the provided checksum.

## 5. Directory Structure
Modifications will occur in:
- `Dashboard/Dashboard1/app/setup/page.tsx`
- `Dashboard/Dashboard1/package.json`

Deletions will occur in:
- `Dashboard/Dashboard1/lib/mnemonic.ts`

New files:
- `Dashboard/Dashboard1/lib/recovery-key.ts`

## 6. Step-by-Step Implementation Guide

### Phase 1: Initialization & Cleanup
1. Run `npm install bs58@6.0.0` in the `Dashboard/Dashboard1` directory.
2. Delete the file `Dashboard/Dashboard1/lib/mnemonic.ts`.

### Phase 2: Core Cryptography Logic
1. Create `Dashboard/Dashboard1/lib/recovery-key.ts`.
2. Implement the encoding logic:
   - Export an `async function generateRecoveryKey(entropyHashHex: string): Promise<string>`.
   - Convert the first 64 hex characters (32 bytes) of `entropyHashHex` to a `Uint8Array`.
   - Hash the 32-byte array using `window.crypto.subtle.digest('SHA-256', ...)`.
   - Take the first 4 bytes of the SHA-256 hash as the checksum.
   - Create a new 36-byte `Uint8Array` (32 bytes key + 4 bytes checksum).
   - Encode the 36 bytes using `bs58.encode()`.
   - Format the resulting string by inserting a hyphen `-` every 5 characters.
3. Implement the decoding/verification logic:
   - Export an `async function verifyAndDecodeRecoveryKey(formattedKey: string): Promise<{ valid: boolean, rawHex: string | null }>`.
   - Strip all hyphens and whitespace from `formattedKey`.
   - Try/catch `bs58.decode()`. If it throws, return `valid: false`.
   - Ensure the decoded byte array is exactly 36 bytes.
   - Extract the first 32 bytes (the key) and the last 4 bytes (the provided checksum).
   - Hash the 32-byte key using SHA-256.
   - Compare the first 4 bytes of the newly calculated hash with the provided checksum.
   - If they match, convert the 32-byte key to a hex string (64 characters) and return `valid: true, rawHex: ...`.

### Phase 3: Frontend / UI Implementation
1. In `Dashboard/Dashboard1/app/setup/page.tsx`, remove mnemonic imports and import the new functions from `@/lib/recovery-key`.
2. Update the `handleEntropyComplete` function to await `generateRecoveryKey(key)` and store the formatted Base58 string in state (e.g., `recoveryKey`).
3. Update the UI in the `confirm` step:
   - Change the title to "Save Your Post-Quantum Recovery Key".
   - Replace the mnemonic 12-word grid with a large, centered, monospace `<div>` displaying the chunked Base58 string.
   - Update the description to explain that the hyphens make it easier to read, and it contains a built-in checksum.
   - Update the "Copy" button to copy the formatted string.
   - Update the confirmation checkbox text.

### Phase 4: Integration
1. During the `handleAccountSubmit` function, you can send the raw 64-character hex key (extracted during step 1 or decoded from the Base58 string) to the `/api/auth/setup` endpoint to ensure absolute compatibility with the existing backend database encryption logic.

---

## 7. Cryptography & Security Explainer (For Users)

### Why are we doing this?
In classical computing, a 128-bit key (like a 12-word phrase) is unbreakable. However, if powerful Quantum Computers become a reality, an algorithm known as **Grover's Algorithm** can effectively halve the security of symmetric encryption and hash functions. In a post-quantum world, a 128-bit key acts like a 64-bit key, which *can* be cracked. 

To achieve **Post-Quantum Security**, we must double the key size to 256 bits. A 256-bit key provides 128 bits of post-quantum security, which remains unbreakable by the laws of physics.

### The Problem with 256 bits
A raw 256-bit key is a 64-character hexadecimal string (e.g., `a1b2c3d4...`). Asking humans to accurately write down 64 random characters is a recipe for disaster. Hexadecimal includes numbers and letters that look identical depending on handwriting (`0` vs `O`, `1` vs `l`). If you make a single mistake writing it down, your database is permanently lost, and the system won't even be able to tell you *which* character you got wrong.

### The Solution: Base58 + Checksums
To provide military-grade post-quantum security while protecting against human error, this system implements three layers of operational security:

1. **Base58 Encoding:** Instead of Hexadecimal (base-16), we use Base58. Base58 uses upper and lowercase letters and numbers, but specifically **removes** visually confusing characters: `0` (zero), `O` (capital o), `I` (capital i), and `l` (lowercase L). 
2. **Chunking:** The resulting string is broken into small chunks of 5 characters separated by hyphens (e.g., `XyZ12-3aBcD`), making it much easier for your eyes to track while transcribing.
3. **Cryptographic Checksum:** Before encoding, we calculate a mathematical fingerprint (SHA-256 hash) of your key and append the first 4 bytes to the end. When you type the key back in during a recovery scenario, the software instantly recalculates the fingerprint. If you made a typo, the fingerprints won't match, and the system will immediately alert you that the key is invalid *before* attempting decryption. 
