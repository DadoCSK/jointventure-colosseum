export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

/** Reads only a local Blob. No network, storage, filename or content transmission. */
export async function hashLocalFile(file: Blob): Promise<string> {
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('Select a file no larger than 20 MiB.');
  if (!globalThis.crypto?.subtle) throw new Error('Local hashing requires HTTPS or localhost.');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function digestBytes(hex: string): number[] {
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error('A SHA-256 fingerprint must contain exactly 64 hexadecimal characters (32 bytes).');
  return Array.from({length: 32}, (_, index) => parseInt(hex.slice(index * 2, index * 2 + 2), 16));
}
