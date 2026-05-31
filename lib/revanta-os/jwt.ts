const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBytes(input: ArrayBuffer | Uint8Array | string) {
  if (typeof input === "string") {
    return textEncoder.encode(input);
  }

  if (input instanceof Uint8Array) {
    return input;
  }

  return new Uint8Array(input);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type RevantaTokenPayload = {
  sub: string;
  orgId?: string;
  email: string;
  role?: string;
  jti: string;
  iat: number;
  exp: number;
};

export async function signJwt(payload: Omit<RevantaTokenPayload, "iat" | "exp">, secret: string, ttlSeconds: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: RevantaTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds
  };

  const headerPart = bytesToBase64Url(textEncoder.encode(JSON.stringify(header)));
  const payloadPart = bytesToBase64Url(textEncoder.encode(JSON.stringify(fullPayload)));
  const unsigned = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, textEncoder.encode(unsigned)));
  const signaturePart = bytesToBase64Url(signature);

  return `${unsigned}.${signaturePart}`;
}

export async function verifyJwt(token: string, secret: string): Promise<RevantaTokenPayload | null> {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  const unsigned = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(signaturePart), textEncoder.encode(unsigned));
  if (!valid) {
    return null;
  }

  const payload = JSON.parse(textDecoder.decode(base64UrlToBytes(payloadPart))) as RevantaTokenPayload;
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(token));
  return bytesToHex(new Uint8Array(digest));
}

export async function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}
