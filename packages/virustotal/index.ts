import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  boolean,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.virustotal.com/api/v3";

const virustotal = defineProvider({
  name: "VirusTotal",
  hosts: ["www.virustotal.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The users endpoint accepts the API key itself as the user id (documented; no key-free self lookup exists). The user object always has a top-level id.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { "x-apikey": account.fields.token, accept: "application/json" },
    });
    const { data } = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: data.id, displayName: data.id } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-apikey": account.fields.token, accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const path = (value: string) => encodeURIComponent(value);

// A URL's identifier is its URL base64url-encoded without padding (or the sha256 of the URL).
const urlId = (value: string) => {
  if (/^[0-9a-f]{64}$/i.test(value)) return value;
  let binary = "";
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const virustotalTools = (account: Account, signal: AbortSignal) => {
  const h = headers(account);
  const get = async (fetch: typeof globalThis.fetch, pathAndQuery: string) =>
    decodeJson(await fetch(`${base}${pathAndQuery}`, { signal, headers: h }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, pathAndQuery: string, body?: unknown) =>
    decodeJson(
      await fetch(`${base}${pathAndQuery}`, {
        method,
        signal,
        headers: body === undefined ? h : { ...h, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      json(),
    );

  const paging = { limit: number().optional(), cursor: string().optional() };
  const segment = (collection: string, id: string) => `/${collection}/${path(collection === "urls" ? urlId(id) : id)}`;

  // Comments, votes, relationships and rescans work the same on every object type.
  const common = (collection: string, noun: string, idNote: string) => ({
    comments: query(
      {
        description: `List comments on ${noun}. ${idNote} limit is 1-40; pass the returned cursor for the next page.`,
        input: object({ id: string(), ...paging }),
      },
      async ({ fetch }, { id, ...rest }) => get(fetch, `${segment(collection, id)}/comments?${search(rest)}`),
    ),
    addComment: mutation(
      {
        description: `Add a public comment to ${noun}. ${idNote} Comments may contain #hashtags.`,
        input: object({ id: string(), text: string({ minLength: 1 }) }),
        approval: always(),
      },
      async ({ fetch }, { id, text }) =>
        send(fetch, "POST", `${segment(collection, id)}/comments`, {
          data: { type: "comment", attributes: { text } },
        }),
    ),
    relationship: query(
      {
        description: `List objects related to ${noun} through a named relationship (for example comments, votes, analyses, resolutions, contacted_domains, contacted_ips, contacted_urls, communicating_files, downloaded_files, referrer_files, graphs, historical_whois, subdomains, siblings; valid names depend on the object type, see the VirusTotal relationships reference). ${idNote} Set descriptorsOnly to return just object ids and types.`,
        input: object({
          id: string(),
          relationship: string(),
          descriptorsOnly: boolean().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, { id, relationship, descriptorsOnly, ...rest }) =>
        get(
          fetch,
          `${segment(collection, id)}/${descriptorsOnly === true ? "relationships/" : ""}${path(relationship)}?${search(rest)}`,
        ),
    ),
    votes: query(
      {
        description: `List the community votes (harmless or malicious) on ${noun}. ${idNote}`,
        input: object({ id: string(), ...paging }),
      },
      async ({ fetch }, { id, ...rest }) => get(fetch, `${segment(collection, id)}/votes?${search(rest)}`),
    ),
    addVote: mutation(
      {
        description: `Vote on ${noun}. verdict is "harmless" or "malicious". ${idNote}`,
        input: object({ id: string(), verdict: string() }),
        approval: always(),
      },
      async ({ fetch }, { id, verdict }) => {
        if (verdict !== "harmless" && verdict !== "malicious") {
          throw new Error(`verdict must be "harmless" or "malicious", got "${verdict}"`);
        }
        return send(fetch, "POST", `${segment(collection, id)}/votes`, {
          data: { type: "vote", attributes: { verdict } },
        });
      },
    ),
    rescan: mutation(
      {
        description: `Ask VirusTotal to re-analyse ${noun} already in its dataset. Returns an analysis object; read it with analyses.get. Consumes quota.`,
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send(fetch, "POST", `${segment(collection, id)}/analyse`),
    ),
  });

  return router({
    files: router(
      {
        get: query(
          {
            description:
              "Get a file report: detection stats, per-engine results, names, type, hashes, signatures and more. id is the file's MD5, SHA-1 or SHA-256.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/files/${path(id)}`),
        ),
        upload: mutation(
          {
            description:
              "Upload a file for analysis (up to 32 MB). contentBase64 is the base64 file content; name is the file name. password unlocks a protected archive. Returns an analysis id to read with analyses.get. For files over 32 MB call files.uploadUrl and upload to that URL.",
            input: object({
              contentBase64: string({ minLength: 1 }),
              name: string({ minLength: 1 }),
              password: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { contentBase64, name, password }) => {
            const form = new FormData();
            const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
            form.set("file", new Blob([bytes]), name);
            if (password !== undefined) form.set("password", password);
            return decodeJson(await fetch(`${base}/files`, { method: "POST", signal, headers: h, body: form }), json());
          },
        ),
        uploadUrl: query(
          {
            description:
              "Get a one-time URL for uploading a file larger than 32 MB (up to 650 MB). POST the file as multipart form data to the returned URL.",
            input: object({}),
          },
          async ({ fetch }) => get(fetch, "/files/upload_url"),
        ),
        downloadUrl: query(
          {
            description: "Get a short-lived signed URL to download a file from VirusTotal (Premium API only). id is MD5, SHA-1 or SHA-256.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/files/${path(id)}/download_url`),
        ),
        behaviourSummary: query(
          {
            description: "Get a summary merging every sandbox behaviour report of a file: files, registry keys, processes, network traffic, tags and verdicts.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/files/${path(id)}/behaviour_summary`),
        ),
        behaviours: query(
          {
            description: "List the individual sandbox behaviour reports of a file.",
            input: object({ id: string(), ...paging }),
          },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/files/${path(id)}/behaviours?${search(rest)}`),
        ),
        behaviour: query(
          {
            description: "Get one sandbox behaviour report. id is the report id from files.behaviours, in the form <sha256>_<sandbox name>.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/file_behaviours/${path(id)}`),
        ),
        mitreTrees: query(
          {
            description: "Get a summary of the MITRE ATT&CK tactics and techniques observed in a file's sandbox runs.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/files/${path(id)}/behaviour_mitre_trees`),
        ),
        ...common("files", "a file", "id is the file's MD5, SHA-1 or SHA-256."),
      },
      { title: "Files", description: "File reports, uploads, sandbox behaviour, comments, votes and related objects." },
    ),
    urls: router(
      {
        scan: mutation(
          {
            description:
              "Submit a URL for scanning. Returns an analysis id to read with analyses.get. Consumes quota and shares the URL with VirusTotal.",
            input: object({ url: string({ minLength: 1 }) }),
            approval: always(),
          },
          async ({ fetch }, { url }) =>
            decodeJson(
              await fetch(`${base}/urls`, {
                method: "POST",
                signal,
                headers: { ...h, "content-type": "application/x-www-form-urlencoded" },
                body: search({ url }),
              }),
              json(),
            ),
        ),
        get: query(
          {
            description:
              "Get a URL report with detection stats and per-engine results. id is the URL itself or its sha256; the URL is converted to VirusTotal's identifier for you.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, segment("urls", id)),
        ),
        ...common("urls", "a URL", "id is the URL itself or its sha256."),
      },
      { title: "URLs", description: "Scan URLs and read URL reports, comments, votes and related objects." },
    ),
    domains: router(
      {
        get: query(
          {
            description:
              "Get a domain report: reputation, detection stats, DNS records, WHOIS, categories and popularity ranks.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, segment("domains", id)),
        ),
        ...common("domains", "a domain", "id is the domain name, for example example.com."),
      },
      { title: "Domains", description: "Domain reports, comments, votes and related objects." },
    ),
    ipAddresses: router(
      {
        get: query(
          {
            description:
              "Get an IP address report: reputation, detection stats, ASN, network, country and WHOIS. IPv4 or IPv6.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, segment("ip_addresses", id)),
        ),
        ...common("ip_addresses", "an IP address", "id is the IPv4 or IPv6 address."),
      },
      { title: "IP addresses", description: "IP address reports, comments, votes and related objects." },
    ),
    analyses: router(
      {
        get: query(
          {
            description:
              "Get an analysis by id (returned when scanning or uploading). status is queued, in-progress or completed; stats and results appear when completed.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/analyses/${path(id)}`),
        ),
        submission: query(
          {
            description: "Get a submission object by id.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/submissions/${path(id)}`),
        ),
        operation: query(
          {
            description: "Get a long-running operation by id, for example a bulk comment or collection operation.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/operations/${path(id)}`),
        ),
      },
      { title: "Analyses", description: "Read the results of scans and uploads." },
    ),
    search: router(
      {
        search: query(
          {
            description:
              "Search VirusTotal for a hash, URL, domain, IP address or comment tag. Returns matching objects. Not the advanced corpus search.",
            input: object({ query: string({ minLength: 1 }), ...paging }),
          },
          async ({ fetch }, input) => get(fetch, `/search?${search(input)}`),
        ),
        intelligence: query(
          {
            description:
              "Advanced corpus search with VirusTotal Intelligence modifiers such as type:peexe positives:5+ (Premium API only). order is for example last_submission_date-. limit is 1-300.",
            input: object({
              query: string({ minLength: 1 }),
              order: string().optional(),
              descriptorsOnly: boolean().optional(),
              ...paging,
            }),
          },
          async ({ fetch }, { descriptorsOnly, ...rest }) =>
            get(fetch, `/intelligence/search?${search({ ...rest, descriptors_only: descriptorsOnly })}`),
        ),
        snippets: query(
          {
            description: "Get the content search (VTGrep) snippets for a snippet id returned by an intelligence search (part of Intelligence search, likely Premium only).",
            input: object({ snippet: string({ minLength: 1 }) }),
          },
          async ({ fetch }, { snippet }) => get(fetch, `/intelligence/search/snippets/${path(snippet)}`),
        ),
        metadata: query(
          {
            description: "Get VirusTotal metadata: the list of antivirus engines, relationship names and privilege levels.",
            input: object({}),
          },
          async ({ fetch }) => get(fetch, "/metadata"),
        ),
      },
      { title: "Search", description: "Search VirusTotal and read its metadata." },
    ),
    comments: router(
      {
        latest: query(
          {
            description:
              "List the latest comments across VirusTotal. filter narrows by tag or date, for example tag:malware. limit is 1-40.",
            input: object({ filter: string().optional(), ...paging }),
          },
          async ({ fetch }, input) => get(fetch, `/comments?${search(input)}`),
        ),
        get: query(
          { description: "Get one comment by id.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/comments/${path(id)}`),
        ),
        delete: mutation(
          {
            description: "Delete a comment you wrote.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) => send(fetch, "DELETE", `/comments/${path(id)}`),
        ),
        vote: mutation(
          {
            description: "Vote on a comment. verdict is positive, negative or abuse.",
            input: object({ id: string(), verdict: string() }),
            approval: always(),
          },
          async ({ fetch }, { id, verdict }) => {
            if (verdict !== "positive" && verdict !== "negative" && verdict !== "abuse") {
              throw new Error(`verdict must be positive, negative or abuse, got "${verdict}"`);
            }
            return send(fetch, "POST", `/comments/${path(id)}/vote`, { data: verdict });
          },
        ),
      },
      { title: "Comments", description: "Read, delete and vote on community comments." },
    ),
    collections: router(
      {
        get: query(
          {
            description: "Get a collection (a named group of files, URLs, domains and IPs, such as a threat report) by id.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/collections/${path(id)}`),
        ),
        relationship: query(
          {
            description:
              "List objects related to a collection through a relationship such as files, urls, domains, ip_addresses, comments or attack_techniques. Set descriptorsOnly to return just ids.",
            input: object({
              id: string(),
              relationship: string(),
              descriptorsOnly: boolean().optional(),
              ...paging,
            }),
          },
          async ({ fetch }, { id, relationship, descriptorsOnly, ...rest }) =>
            get(
              fetch,
              `/collections/${path(id)}/${descriptorsOnly === true ? "relationships/" : ""}${path(relationship)}?${search(rest)}`,
            ),
        ),
        create: mutation(
          {
            description:
              "Create a collection. attributes is for example {name, description}. items lists objects to include as {type: file|url|domain|ip_address, id} (a url item may use url, the literal URL, instead of id); files use the SHA-256 as id. rawItems is free text from which VirusTotal extracts IoCs. Returns the new collection.",
            input: object({ attributes: json(), items: json().optional(), rawItems: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { attributes, items, rawItems }) => {
            const keys: Record<string, string> = { file: "files", url: "urls", domain: "domains", ip_address: "ip_addresses" };
            const relationships: Record<string, { data: unknown[] }> = {};
            if (items !== undefined) {
              if (!Array.isArray(items)) throw new Error("items must be an array");
              for (const item of items as Array<Record<string, unknown>>) {
                const type = String(item?.type);
                const key = keys[type];
                if (key === undefined) throw new Error(`item type must be file, url, domain or ip_address, got "${type}"`);
                const entry = typeof item.id === "string" ? { type, id: item.id } : type === "url" && typeof item.url === "string" ? { type, url: item.url } : undefined;
                if (entry === undefined) throw new Error(`item of type ${type} needs an id${type === "url" ? " or url" : ""}`);
                (relationships[key] ??= { data: [] }).data.push(entry);
              }
            }
            return send(fetch, "POST", "/collections", {
              data: {
                type: "collection",
                attributes,
                ...(Object.keys(relationships).length === 0 ? {} : { relationships }),
                ...(rawItems === undefined ? {} : { raw_items: rawItems }),
              },
            });
          },
        ),
        delete: mutation(
          {
            description: "Delete a collection you own.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) => send(fetch, "DELETE", `/collections/${path(id)}`),
        ),
        comments: query(
          {
            description: "List comments on a collection.",
            input: object({ id: string(), ...paging }),
          },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/collections/${path(id)}/comments?${search(rest)}`),
        ),
      },
      { title: "Collections", description: "Read, create and delete collections of indicators." },
    ),
    attack: router(
      {
        technique: query(
          {
            description: "Get a MITRE ATT&CK technique object by id, for example T1059.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/attack_techniques/${path(id)}`),
        ),
        tactic: query(
          {
            description: "Get a MITRE ATT&CK tactic object by id, for example TA0002.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/attack_tactics/${path(id)}`),
        ),
        popularThreatCategories: query(
          { description: "List the popular threat categories used in antivirus verdicts.", input: object({}) },
          async ({ fetch }) => get(fetch, "/popular_threat_categories"),
        ),
      },
      { title: "ATT&CK", description: "MITRE ATT&CK techniques and tactics, and popular threat categories." },
    ),
    account: router(
      {
        user: query(
          {
            description: "Get a VirusTotal user by id or username. Your own API key also works as the id.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/users/${path(id)}`),
        ),
        quotas: query(
          {
            description: "Get the overall API quotas and current usage for a user. Your own API key works as the id.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/users/${path(id)}/overall_quotas`),
        ),
      },
      { title: "Account", description: "Look up users and API quota usage." },
    ),
  });
};

export default defineApp({ user: { accounts: { virustotal: virustotal.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.virustotal ?? [], (account) => virustotalTools(account, signal), { signal }), {
    title: "VirusTotal",
    description:
      "Check and scan files, URLs, domains and IP addresses with VirusTotal: reports, uploads, sandbox behaviour, comments, votes, search, collections and quotas.",
    instructions:
      "Look up an indicator before submitting it: files.get, urls.get, domains.get and ipAddresses.get read existing reports without uploading anything. Scans and uploads (files.upload, urls.scan) share data with VirusTotal and its community. Public API keys allow 4 requests per minute and 500 per day; Premium-only endpoints (file download, Intelligence search) return 403 on a public key.",
    icons,
  }),
}));
