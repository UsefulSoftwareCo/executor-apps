import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const searchBase = "https://api.certspotter.com/v1";
const monitoringBase = "https://sslmate.com/api/v3/monitoring";

const certspotter = defineProvider({
  name: "SSLMate Cert Spotter",
  hosts: ["api.certspotter.com", "sslmate.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A bad key answers bad_credentials; a valid one lists issuances for a reserved domain.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${searchBase}/issuances?domain=example.com`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, array(json()));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" });

const expandDescription =
  "expand lists extra fields to include: dns_names, pubkey, pubkey_der, issuer, issuer.website, issuer.caa_domains, issuer.operator, issuer.pubkey_der, issuer.name_der, revocation, problem_reporting, cert_der.";

const monitoredPath = (name: string) => `${monitoringBase}/monitored_domains/${encodeURIComponent(name)}`;

const certspotterTools = (account: Account, signal: AbortSignal) =>
  router({
    issuances: router(
      {
        list: query(
          {
            description: `List unexpired certificate issuances seen in Certificate Transparency logs for a domain, in discovery order. domain must be a registered domain or below one (example.com, www.example.com). includeSubdomains also returns sub-domains of any depth; matchWildcards also returns wildcard names that match. Page by passing the last issuance's id as after until an empty array comes back. ${expandDescription} Unauthenticated-tier limits apply to keys without a Search API plan.`,
            input: object({
              domain: string(),
              includeSubdomains: boolean().optional(),
              matchWildcards: boolean().optional(),
              after: string().optional(),
              expand: array(string()).optional(),
            }),
          },
          async ({ fetch }, { domain, includeSubdomains, matchWildcards, after, expand }) => {
            const params = new URLSearchParams({ domain });
            if (includeSubdomains !== undefined) params.set("include_subdomains", String(includeSubdomains));
            if (matchWildcards !== undefined) params.set("match_wildcards", String(matchWildcards));
            if (after !== undefined) params.set("after", after);
            for (const field of expand ?? []) params.append("expand", field);
            return decodeJson(await fetch(`${searchBase}/issuances?${params}`, { signal, headers: headers(account) }), json());
          },
        ),
        firehose: query(
          {
            description: `Stream every certificate issuance recorded in Certificate Transparency logs. Without after it starts about an hour back; then pass the last id as after and repeat until an empty array, after which wait for the Retry-After interval (5 minutes). A lagging_client error means restart without after. Requires a Firehose Access subscription. ${expandDescription}`,
            input: object({ after: string().optional(), expand: array(string()).optional() }),
          },
          async ({ fetch }, { after, expand }) => {
            const params = new URLSearchParams();
            if (after !== undefined) params.set("after", after);
            for (const field of expand ?? []) params.append("expand", field);
            return decodeJson(
              await fetch(`${searchBase}/issuances/firehose?${params}`, { signal, headers: headers(account) }),
              json(),
            );
          },
        ),
      },
      { title: "Issuances", description: "Search the Certificate Transparency Search API v1." },
    ),
    monitoredDomains: router(
      {
        list: query(
          {
            description:
              "List all Cert Spotter monitored domain objects ({ name, enabled }). A name with a leading dot (.example.com) monitors the domain and its whole sub-domain tree; a bare name monitors only that name.",
            input: object({}),
          },
          async ({ fetch }) =>
            decodeJson(await fetch(`${monitoringBase}/monitored_domains`, { signal, headers: headers(account) }), json()),
        ),
        get: query(
          {
            description: "Get one monitored domain by name, for example .example.com or www.example.com. Returns 404 if absent.",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(await fetch(monitoredPath(name), { signal, headers: headers(account) }), json()),
        ),
        set: mutation(
          {
            description:
              "Add a monitored domain or update an existing one. name with a leading dot also monitors every sub-domain. enabled defaults to true for new domains and is left unchanged on existing ones when omitted. The most specific matching entry decides whether an endpoint is monitored, so enabled false can exclude a sub-domain.",
            input: object({ name: string(), enabled: boolean().optional() }),
            approval: always(),
          },
          async ({ fetch }, { name, enabled }) =>
            decodeJson(
              await fetch(monitoredPath(name), {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify(enabled === undefined ? {} : { enabled }),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a monitored domain by name. Returns 404 if there is none.",
            input: object({ name: string() }),
            approval: always(),
          },
          async ({ fetch }, { name }) => {
            const response = await fetch(monitoredPath(name), { method: "DELETE", signal, headers: headers(account) });
            if (!response.ok) throw new Error(`Cert Spotter returned ${response.status}: ${await response.text()}`);
            return { deleted: true };
          },
        ),
      },
      { title: "Monitored domains", description: "Cert Spotter monitored domains API." },
    ),
    authorize: router(
      {
        publicKey: mutation(
          {
            description:
              "Authorize a public key so Cert Spotter stops notifying about certificates that certify it for the given DNS names. Give the key as pubkeySha256 (lowercase hex SHA-256 of the DER SubjectPublicKeyInfo) with dnsNames, or as a PEM-encoded CSR in csrPem (authorizes every SAN in the CSR).",
            input: object({
              pubkeySha256: string().optional(),
              dnsNames: array(string()).optional(),
              csrPem: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { pubkeySha256, dnsNames, csrPem }) => {
            const csr = csrPem !== undefined;
            if (!csr && (pubkeySha256 === undefined || dnsNames === undefined))
              throw new Error("Provide csrPem, or both pubkeySha256 and dnsNames.");
            return decodeJson(
              await fetch(`${monitoringBase}/known_keys`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": csr ? "application/x-pem-file" : "application/json" },
                body: csr ? csrPem : JSON.stringify({ pubkey_sha256: pubkeySha256, dns_names: dnsNames }),
              }),
              json(),
            );
          },
        ),
        certificate: mutation(
          {
            description:
              "Authorize a certificate so Cert Spotter will not notify about it, and drop it from the unknown certificates list. Give certPem (PEM-encoded certificate) or tbsSha256 (lowercase hex SHA-256 of the RFC 6962 TBSCertificate). Prefer authorizing public keys before issuance: a certificate already discovered has already triggered a notification.",
            input: object({ certPem: string().optional(), tbsSha256: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { certPem, tbsSha256 }) => {
            if (certPem === undefined && tbsSha256 === undefined) throw new Error("Provide certPem or tbsSha256.");
            const pem = certPem !== undefined;
            return decodeJson(
              await fetch(`${monitoringBase}/known_certs`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": pem ? "application/x-pem-file" : "application/json" },
                body: pem ? certPem : JSON.stringify({ tbs_sha256: tbsSha256 }),
              }),
              json(),
            );
          },
        ),
      },
      { title: "Authorize", description: "Cert Spotter authorization API for known keys and certificates." },
    ),
  });

export default defineApp({ user: { accounts: { certspotter: certspotter.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.certspotter ?? [], (account) => certspotterTools(account, signal), { signal }), {
    title: "SSLMate Cert Spotter",
    description:
      "Search Certificate Transparency logs for certificates issued for a domain, and manage Cert Spotter monitored domains and authorized keys and certificates.",
    icons,
  }),
}));
