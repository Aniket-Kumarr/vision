import { Blueprint } from './types';

const MAX_ENCODED_LENGTH = 8000;

/** Convert a Uint8Array to a base64url string. */
function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Convert a base64url string back to a Uint8Array. */
function base64urlToUint8(str: string): Uint8Array<ArrayBuffer> {
  // Restore standard base64 padding
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Compress bytes using the native CompressionStream API (deflate-raw). */
async function compress(input: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writer.write(input as any);
  writer.close();

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(new ArrayBuffer(totalLength));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Decompress bytes using the native DecompressionStream API (deflate-raw). */
async function decompress(input: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writer.write(input as any);
  writer.close();

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(new ArrayBuffer(totalLength));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Whether the native CompressionStream API is available. */
function compressionAvailable(): boolean {
  return (
    typeof CompressionStream !== 'undefined' &&
    typeof DecompressionStream !== 'undefined'
  );
}

/**
 * Encode a Blueprint into a compact, URL-safe string.
 *
 * Format (with compression):  "z." + base64url(deflate-raw(JSON))
 * Format (fallback):           "b." + base64url(JSON)
 *
 * Returns null and logs an error if the resulting string exceeds MAX_ENCODED_LENGTH.
 */
export async function encodeBlueprint(
  blueprint: Blueprint,
): Promise<{ encoded: string } | { error: string }> {
  const json = JSON.stringify(blueprint);
  const enc = new TextEncoder();
  const jsonBytes = enc.encode(json) as Uint8Array<ArrayBuffer>;

  let encoded: string;

  if (compressionAvailable()) {
    try {
      const compressed = await compress(jsonBytes);
      encoded = 'z.' + uint8ToBase64url(compressed);
    } catch {
      // Fall back to plain base64url
      encoded = 'b.' + uint8ToBase64url(jsonBytes);
    }
  } else {
    encoded = 'b.' + uint8ToBase64url(jsonBytes);
  }

  if (encoded.length > MAX_ENCODED_LENGTH) {
    return { error: 'Lesson too large to share via link' };
  }

  return { encoded };
}

/**
 * Decode a slug produced by encodeBlueprint back into a Blueprint.
 * Returns null on any error.
 */
export async function decodeBlueprint(encoded: string): Promise<Blueprint | null> {
  try {
    const dotIdx = encoded.indexOf('.');
    if (dotIdx === -1) return null;

    const prefix = encoded.slice(0, dotIdx);
    const payload = encoded.slice(dotIdx + 1);

    const bytes = base64urlToUint8(payload);
    const dec = new TextDecoder();
    let json: string;

    if (prefix === 'z') {
      const decompressed = await decompress(bytes);
      json = dec.decode(decompressed);
    } else if (prefix === 'b') {
      json = dec.decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(json) as Blueprint;
    // Basic validation
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.title !== 'string' ||
      !Array.isArray(parsed.steps)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
