// Probes a remote MCP server without credentials, the way Executor's quick add does:
// initialize, then protected-resource and authorization-server metadata.
// Usage: node scripts/mcp-probe.ts <url>
const url = new URL(process.argv[2] ?? "");
const initialize = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "probe", version: "0" } },
  }),
});
const challenge = initialize.headers.get("www-authenticate");
const result: Record<string, unknown> = { status: initialize.status, challenge };
const named = challenge?.match(/resource_metadata="([^"]+)"/)?.[1];
const candidates = [
  named,
  `${url.origin}/.well-known/oauth-protected-resource${url.pathname === "/" ? "" : url.pathname}`,
  `${url.origin}/.well-known/oauth-protected-resource`,
].filter((value): value is string => Boolean(value));
for (const candidate of candidates) {
  const response = await fetch(candidate).catch(() => undefined);
  if (response?.ok) {
    const metadata = (await response.json().catch(() => undefined)) as { authorization_servers?: string[] } | undefined;
    if (!metadata) continue;
    result.resourceMetadata = { url: candidate, ...metadata };
    // authorization_servers may hold a relative reference (Blackbaud returns "/"); resolve it against the resource.
    const issuer = metadata.authorization_servers?.[0] ?? url.origin;
    let issuerUrl: URL;
    try {
      issuerUrl = new URL(issuer, url);
    } catch {
      result.issuerError = `unparseable authorization server: ${issuer}`;
      break;
    }
    result.issuer = issuerUrl.href;
    const base = issuerUrl.href.replace(/\/+$/, "");
    const root = issuerUrl.origin;
    const suffix = issuerUrl.pathname.replace(/\/+$/, "");
    // RFC 8414 puts the well-known segment between host and path; many servers append it to the issuer instead.
    const urls = [
      `${base}/.well-known/oauth-authorization-server`,
      `${root}/.well-known/oauth-authorization-server${suffix}`,
      `${base}/.well-known/openid-configuration`,
      `${root}/.well-known/openid-configuration${suffix}`,
    ];
    for (const metadataUrl of urls) {
      const server = await fetch(metadataUrl).catch(() => undefined);
      if (!server?.ok) continue;
      const doc = (await server.json().catch(() => undefined)) as Record<string, unknown> | undefined;
      if (!doc || typeof doc !== "object") continue;
      result.authorizationServer = {
        url: metadataUrl,
        issuer: doc.issuer,
        registration_endpoint: doc.registration_endpoint ?? null,
        client_id_metadata_document_supported: doc.client_id_metadata_document_supported ?? null,
        code_challenge_methods_supported: doc.code_challenge_methods_supported ?? null,
      };
      break;
    }
    break;
  }
}
result.verdict =
  initialize.ok
    ? "anonymous"
    : (initialize.status === 401 || initialize.status === 403) && result.authorizationServer
      ? "oauth"
      : "credentials-or-undetermined";
console.log(JSON.stringify(result, null, 2));
