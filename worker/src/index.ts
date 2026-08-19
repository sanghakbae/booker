/**
 * Image uploads for booker.
 *
 * The site is a static export, so it has no server of its own and cannot hold
 * an R2 credential. This Worker is that server: it verifies the caller's
 * Firebase ID token, checks they may edit the manual they are uploading to,
 * then writes to R2 and serves the file back.
 */

interface Env {
  UPLOADS: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // A marker for confirming which build is live.
    if (url.pathname === "/health") {
      return json({ ok: true, verifier: "jwks" }, 200, cors);
    }

    if (url.pathname === "/upload" && request.method === "POST") {
      return handleUpload(request, env, cors);
    }

    // Anything else is treated as a request for a stored object.
    if (request.method === "GET" || request.method === "HEAD") {
      return handleGet(url, env);
    }

    return json({ error: "Not found" }, 404, cors);
  },
};

export default worker;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function handleUpload(request: Request, env: Env, cors: Record<string, string>) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return json({ error: "인증이 필요합니다." }, 401, cors);

  let claims: TokenClaims;
  try {
    claims = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  } catch (err) {
    return json({ error: `토큰 검증 실패: ${(err as Error).message}` }, 401, cors);
  }

  const form = await request.formData();
  const file = form.get("file");
  const spaceId = String(form.get("spaceId") ?? "");

  if (!(file instanceof File)) return json({ error: "파일이 없습니다." }, 400, cors);
  if (!spaceId) return json({ error: "매뉴얼이 지정되지 않았습니다." }, 400, cors);
  if (file.size > MAX_BYTES) return json({ error: "10MB를 넘는 이미지입니다." }, 413, cors);
  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: `지원하지 않는 형식입니다: ${file.type}` }, 415, cors);
  }

  const allowed = await canEditSpace(spaceId, claims, env);
  if (!allowed) return json({ error: "이 매뉴얼의 편집 권한이 없습니다." }, 403, cors);

  const key = `${spaceId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      // Keys contain a UUID, so a stored object never changes.
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: { uploadedBy: claims.email ?? claims.user_id, spaceId },
  });

  return json({ url: `${new URL(request.url).origin}/${key}` }, 201, cors);
}

async function handleGet(url: URL, env: Env) {
  const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!key) return new Response("booker uploads", { status: 200 });

  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Images are embedded in public manuals, so they are readable by anyone.
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(object.body, { headers });
}

// --- Firebase permission check -------------------------------------------

/**
 * Re-checks the manual's ownership through the Firestore REST API using the
 * caller's own token, so the Worker grants exactly what the security rules
 * would grant. It never holds a privileged credential of its own.
 */
async function canEditSpace(spaceId: string, claims: TokenClaims, env: Env) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/spaces/${encodeURIComponent(spaceId)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${claims.rawToken}` } });
  if (!res.ok) return false;

  const doc = (await res.json()) as {
    fields?: {
      ownerId?: { stringValue?: string };
      editorEmails?: { arrayValue?: { values?: Array<{ stringValue?: string }> } };
    };
  };

  const ownerId = doc.fields?.ownerId?.stringValue;
  if (ownerId && ownerId === claims.user_id) return true;

  const editors = (doc.fields?.editorEmails?.arrayValue?.values ?? [])
    .map((v) => v.stringValue)
    .filter(Boolean);
  return !!claims.email && editors.includes(claims.email);
}

// --- Token verification ---------------------------------------------------

type TokenClaims = {
  user_id: string;
  email?: string;
  rawToken: string;
};

/**
 * Google publishes the same signing keys as X.509 certificates and as a JWK
 * set. The JWK form is used here because WebCrypto imports it directly —
 * pulling the public key out of a DER certificate by hand is fragile.
 */
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

/**
 * Verifies a Firebase ID token: RS256 signature against Google's published
 * keys, plus issuer, audience and expiry.
 */
async function verifyFirebaseToken(token: string, projectId: string): Promise<TokenClaims> {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) throw new Error("형식이 올바르지 않습니다");

  const header = JSON.parse(decodeSegment(headerPart)) as { alg: string; kid: string };
  const payload = JSON.parse(decodeSegment(payloadPart)) as {
    iss: string;
    aud: string;
    exp: number;
    sub: string;
    email?: string;
  };

  if (header.alg !== "RS256") throw new Error("지원하지 않는 알고리즘입니다");
  if (payload.aud !== projectId) throw new Error("대상 프로젝트가 다릅니다");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("발급자가 올바르지 않습니다");
  }
  if (payload.exp * 1000 < Date.now()) throw new Error("만료된 토큰입니다");
  if (!payload.sub) throw new Error("사용자를 식별할 수 없습니다");

  const jwk = (await fetchKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("서명 키를 찾을 수 없습니다");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBuffer(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );
  if (!valid) throw new Error("서명이 일치하지 않습니다");

  return { user_id: payload.sub, email: payload.email, rawToken: token };
}

type Jwk = JsonWebKey & { kid: string };

let keyCache: { at: number; keys: Jwk[] } | null = null;

async function fetchKeys(): Promise<Jwk[]> {
  if (keyCache && Date.now() - keyCache.at < 60 * 60 * 1000) return keyCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("서명 키를 가져오지 못했습니다");
  const { keys } = (await res.json()) as { keys: Jwk[] };
  keyCache = { at: Date.now(), keys };
  return keys;
}

const decodeSegment = (segment: string) => new TextDecoder().decode(base64UrlToBuffer(segment));

function base64UrlToBuffer(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
