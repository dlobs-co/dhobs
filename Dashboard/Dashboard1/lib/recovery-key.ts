import bs58 from 'bs58'

/**
 * Helper to convert a hex string to a Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have an even length')
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * Helper to convert a Uint8Array to a hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generates a Base58 encoded post-quantum recovery key with a checksum.
 * @param entropyHashHex The raw 128-character (64-byte) hex entropy string.
 * @returns A formatted Base58 string chunked by hyphens.
 */
export async function generateRecoveryKey(entropyHashHex: string): Promise<string> {
  if (entropyHashHex.length < 64) {
    throw new Error('Entropy hash must be at least 64 hex characters (32 bytes)')
  }

  // 1. Extract the first 32 bytes (256 bits) for post-quantum security
  const keyHex = entropyHashHex.substring(0, 64)
  const keyBytes = hexToBytes(keyHex)

  // 2. Generate a SHA-256 checksum of the 32-byte key
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyBytes)
  const hashArray = new Uint8Array(hashBuffer)
  
  // 3. Take the first 4 bytes as the checksum
  const checksum = hashArray.slice(0, 4)

  // 4. Concatenate key and checksum (32 + 4 = 36 bytes)
  const payload = new Uint8Array(36)
  payload.set(keyBytes, 0)
  payload.set(checksum, 32)

  // 5. Encode using Base58
  const base58String = bs58.encode(payload)

  // 6. Format with hyphens every 5 characters for readability
  const formattedChunks = base58String.match(/.{1,5}/g) || []
  return formattedChunks.join('-')
}

/**
 * Verifies and decodes a formatted Base58 recovery key.
 * @param formattedKey The Base58 string (with or without hyphens).
 * @returns An object indicating validity and the raw 64-character hex key if valid.
 */
export async function verifyAndDecodeRecoveryKey(formattedKey: string): Promise<{ valid: boolean; rawHex: string | null }> {
  // 1. Strip hyphens and whitespace
  const cleanKey = formattedKey.replace(/[- \t\n\r]/g, '')

  let payload: Uint8Array
  try {
    // 2. Decode Base58
    payload = bs58.decode(cleanKey)
  } catch (error) {
    // Invalid Base58 characters
    return { valid: false, rawHex: null }
  }

  // 3. Check payload length (must be 36 bytes: 32 key + 4 checksum)
  if (payload.length !== 36) {
    return { valid: false, rawHex: null }
  }

  // 4. Extract key and provided checksum
  const keyBytes = payload.slice(0, 32)
  const providedChecksum = payload.slice(32, 36)

  // 5. Recalculate checksum
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyBytes)
  const hashArray = new Uint8Array(hashBuffer)
  const calculatedChecksum = hashArray.slice(0, 4)

  // 6. Verify checksum matches
  for (let i = 0; i < 4; i++) {
    if (providedChecksum[i] !== calculatedChecksum[i]) {
      return { valid: false, rawHex: null }
    }
  }

  // 7. Validation passed! Return the raw hex (pad to 128 chars to match the original API expectation if necessary)
  const rawHex = bytesToHex(keyBytes)
  // Our system originally generated 64 bytes (128 hex chars) from mouse entropy. 
  // We only use the first 32 bytes (64 hex chars) for the actual key here. 
  // We pad it out to 128 chars with zeros to satisfy any upstream validations that expect a 128 char string, 
  // though the AES key derivation via HKDF will still be perfectly secure with 256 bits of entropy.
  const paddedHex = rawHex.padEnd(128, '0')

  return { valid: true, rawHex: paddedHex }
}
