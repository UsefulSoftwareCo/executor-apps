// HTTP Digest authentication (RFC 7616, MD5, qop=auth), which TiDB Cloud requires for API keys.
// WebCrypto has no MD5, so it is implemented here.

const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

export const md5 = (text: string): string => {
  const data = new TextEncoder().encode(text);
  const padded = new Uint8Array((((data.length + 8) >> 6) + 1) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (data.length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor((data.length * 8) / 2 ** 32), true);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let offset = 0; offset < padded.length; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const shift = S[(i >> 4) * 4 + (i % 4)]!;
      const sum = (a + f + K[i]! + view.getUint32(offset + g * 4, true)) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((word, i) => out.setUint32(i * 4, word, true));
  return [...new Uint8Array(out.buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

type Challenge = { realm: string; nonce: string; opaque?: string; qop?: string; algorithm?: string };

const parseChallenge = (header: string): Challenge | undefined => {
  if (!/^\s*digest\s/i.test(header)) return undefined;
  const fields: Record<string, string> = {};
  for (const match of header.replace(/^\s*digest\s+/i, "").matchAll(/(\w+)=(?:"([^"]*)"|([^,\s]+))/g)) {
    fields[match[1]!.toLowerCase()] = match[2] ?? match[3]!;
  }
  if (!fields.realm || !fields.nonce) return undefined;
  return { realm: fields.realm, nonce: fields.nonce, opaque: fields.opaque, qop: fields.qop, algorithm: fields.algorithm };
};

const authorize = (challenge: Challenge, method: string, url: URL, username: string, password: string, nc: number) => {
  const uri = url.pathname + url.search;
  const cnonce = crypto.randomUUID().replaceAll("-", "");
  const ncText = nc.toString(16).padStart(8, "0");
  const ha1 = md5(`${username}:${challenge.realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const qop = challenge.qop?.split(",").map((value) => value.trim()).includes("auth") ? "auth" : undefined;
  const response = qop
    ? md5(`${ha1}:${challenge.nonce}:${ncText}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${challenge.nonce}:${ha2}`);
  const parts = [
    `username="${username}"`,
    `realm="${challenge.realm}"`,
    `nonce="${challenge.nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
    ...(challenge.algorithm ? [`algorithm=${challenge.algorithm}`] : []),
    ...(challenge.opaque ? [`opaque="${challenge.opaque}"`] : []),
    ...(qop ? [`qop=${qop}`, `nc=${ncText}`, `cnonce="${cnonce}"`] : []),
  ];
  return `Digest ${parts.join(", ")}`;
};

const decodeBasic = (header: string | null) => {
  if (!header || !/^basic\s/i.test(header)) return undefined;
  const text = new TextDecoder().decode(Uint8Array.from(atob(header.replace(/^basic\s+/i, "")), (c) => c.charCodeAt(0)));
  const colon = text.indexOf(":");
  return colon < 0 ? undefined : { username: text.slice(0, colon), password: text.slice(colon + 1) };
};

/**
 * A fetch that answers Digest challenges. A request carrying `Authorization: Basic user:pass` is sent
 * unauthenticated first, then replayed with a Digest header computed from the server's challenge.
 * The challenge is kept per host so later requests skip the round trip.
 */
export const digestFetch = (inner: typeof fetch): typeof fetch => {
  const challenges = new Map<string, { challenge: Challenge; nc: number }>();
  return async (input, init) => {
    const request = new Request(input, init);
    const credentials = decodeBasic(request.headers.get("authorization"));
    if (!credentials) return inner(request);
    const url = new URL(request.url);
    const body = request.body === null ? undefined : await request.clone().arrayBuffer();
    const send = (authorization: string | undefined) => {
      const headers = new Headers(request.headers);
      if (authorization) headers.set("authorization", authorization);
      else headers.delete("authorization");
      return inner(new Request(request.url, { method: request.method, headers, body, signal: request.signal }));
    };
    const key = `${url.host}:${credentials.username}`;
    const cached = challenges.get(key);
    if (cached) {
      cached.nc += 1;
      const response = await send(authorize(cached.challenge, request.method, url, credentials.username, credentials.password, cached.nc));
      if (response.status !== 401) return response;
      await response.body?.cancel();
      challenges.delete(key);
    }
    const first = await send(undefined);
    if (first.status !== 401) return first;
    const challenge = parseChallenge(first.headers.get("www-authenticate") ?? "");
    if (!challenge) return first;
    await first.body?.cancel();
    challenges.set(key, { challenge, nc: 1 });
    return send(authorize(challenge, request.method, url, credentials.username, credentials.password, 1));
  };
};
