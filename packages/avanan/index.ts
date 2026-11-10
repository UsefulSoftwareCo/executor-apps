import {
  accountRouter,
  array,
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

const regions = [
  "smart-api-production-1-us",
  "smart-api-production-1-eu",
  "smart-api-production-1-ca",
  "smart-api-production-5-ap",
  "smart-api-production-1-euw2",
  "smart-api-production-1-mec1",
  "smart-api-production-1-aps1",
] as const;

const avanan = defineProvider({
  name: "Avanan",
  hosts: regions.map((region) => `${region}.avanan.net`),
  auth: {
    apiKey: secrets({
      label: "Smart API client",
      fields: object({
        region: string({ minLength: 1 }),
        appId: string({ minLength: 1 }),
        secretKey: string({ minLength: 1 }),
      }),
    }),
  },
  // GET /scopes lists the tenants the client can reach; it is read-only.
  async health({ account, fetch, signal }) {
    await call(account, fetch, signal, "GET", "/scopes");
  },
});

type Account = { fields: { region: string; appId: string; secretKey: string } };
type Fetch = typeof globalThis.fetch;

const sha256Hex = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const base = (account: Account) => {
  const region = account.fields.region.trim().replace(/^https:\/\//, "").replace(/\.avanan\.net.*$/, "");
  if (!(regions as readonly string[]).includes(region))
    throw new Error(`Unknown Avanan region "${region}". Use one of: ${regions.join(", ")}`);
  return `https://${region}.avanan.net/v1.0`;
};

// sig = sha256(base64(reqId + appId + date + [endpoint] + secretKey)); the endpoint is part of the text only after auth.
const signed = async (account: Account, endpoint: string | undefined, token: string) => {
  const reqId = crypto.randomUUID();
  const date = new Date().toISOString();
  const text = `${reqId}${account.fields.appId}${date}${endpoint ?? ""}${account.fields.secretKey}`;
  const sig = await sha256Hex(btoa(text));
  return {
    Accept: "application/json",
    "x-av-req-id": reqId,
    "x-av-token": token,
    "x-av-app-id": account.fields.appId,
    "x-av-date": date,
    "x-av-sig": sig,
  };
};

// The Smart API reference says the token is valid for 24 hours. Cache for 50 minutes to be safe either way,
// and on a 401 drop the cache and retry once.
const tokens = new Map<string, { token: string; expires: number }>();

const tokenFor = async (account: Account, fetch: Fetch, signal: AbortSignal) => {
  const key = `${base(account)}|${account.fields.appId}|${account.fields.secretKey}`;
  const cached = tokens.get(key);
  if (cached && cached.expires > Date.now()) return cached.token;
  const response = await fetch(`${base(account)}/auth`, { signal, headers: await signed(account, undefined, "") });
  if (!response.ok) throw new Error(`Avanan authentication failed with HTTP ${response.status}: ${await response.text()}`);
  const raw = (await response.text()).trim();
  let token = raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string") token = parsed;
    else if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const data = record.responseData;
      token = String(Array.isArray(data) ? data[0] : (data ?? record.token ?? raw));
    }
  } catch {
    // The auth endpoint returns the bare JWT as plain text.
  }
  const value = token.replace(/^"|"$/g, "");
  tokens.set(key, { token: value, expires: Date.now() + 50 * 60_000 });
  return value;
};

const call = async (
  account: Account,
  fetch: Fetch,
  signal: AbortSignal,
  method: "GET" | "POST" | "PUT",
  endpoint: string,
  body?: unknown,
) => {
  const attempt = async () => {
    const token = await tokenFor(account, fetch, signal);
    const headers = await signed(account, `/v1.0${endpoint}`, token);
    return fetch(`${base(account)}${endpoint}`, {
      method,
      signal,
      headers: body === undefined ? headers : { ...headers, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };
  let response = await attempt();
  if (response.status === 401) {
    tokens.clear();
    response = await attempt();
  }
  const result = await decodeJson(response, json());
  return result;
};

const strings = array(string()).optional();
const exceptionType = string();
const exceptionBody = {
  attachmentMd5: string().optional(),
  senderEmail: string().optional(),
  senderName: string().optional(),
  recipient: string().optional(),
  senderClientIp: string().optional(),
  senderDomain: string().optional(),
  senderIp: string().optional(),
  linkDomains: string().optional(),
  subject: string().optional(),
  comment: string().optional(),
  actionNeeded: string().optional(),
  matchOnlyFuture: string().optional(),
  quarantineAll: string().optional(),
  ignoringSpfCheck: string().optional(),
  subjectMatching: string().optional(),
  linkDomainMatching: string().optional(),
  senderNameMatching: string().optional(),
  senderDomainMatching: string().optional(),
  senderEmailMatching: string().optional(),
  recipientMatching: string().optional(),
};
const exceptionNote =
  " excType is Whitelist or Blacklist. Each *Matching field sets how the matching field is compared (for example exact or contains); see the Avanan Smart API reference for values.";
const scopeNote =
  " scope is a {farm}:{tenant} string from scopes.list; it is required when the API client covers several tenants.";

const avananTools = (account: Account, signal: AbortSignal) => {
  const get = (fetch: Fetch, endpoint: string) => call(account, fetch, signal, "GET", endpoint);
  const post = (fetch: Fetch, endpoint: string, body?: unknown) => call(account, fetch, signal, "POST", endpoint, body);
  const put = (fetch: Fetch, endpoint: string, body: unknown) => call(account, fetch, signal, "PUT", endpoint, body);
  const seg = encodeURIComponent;
  const requestData = (data: Record<string, unknown>) => ({ requestData: data });

  return router({
    scopes: router(
      {
        list: query(
          {
            description:
              "List the scopes ({farm}:{tenant}) this API client can access. MSP clients see every managed tenant. Call this first to find scope values.",
            input: object({}),
          },
          async ({ fetch }) => get(fetch, "/scopes"),
        ),
      },
      { title: "Scopes", description: "Tenants the API client can reach." },
    ),
    events: router(
      {
        get: query(
          {
            description: "Get one security event by its Avanan event id, with its actions and available follow-up actions.",
            input: object({ eventId: string() }),
          },
          async ({ fetch }, { eventId }) => get(fetch, `/event/${seg(eventId)}`),
        ),
        search: query(
          {
            description:
              "Search security events. startDate is required (ISO 8601, for example 2024-01-01T00:00:00.000Z). Filters: eventTypes (phishing, malware, suspicious_malware, dlp, anomaly, shadow_it, malicious_url_click, malicious_url), eventStates (new, detected, pending, remediated, dismissed, exception), severities (lowest, low, medium, high, critical), saas (office365_emails, office365_onedrive, office365_sharepoint, sharefile, slack, ms_teams, google_mail), eventIds, confidenceIndicator, description (substring). Pass the scrollId from the previous response to fetch the next page.",
            input: object({
              startDate: string(),
              endDate: string().optional(),
              scopes: strings,
              eventTypes: strings,
              eventStates: strings,
              severities: strings,
              saas: strings,
              eventIds: strings,
              confidenceIndicator: string().optional(),
              description: string().optional(),
              scrollId: string().optional(),
            }),
          },
          async ({ fetch }, input) => post(fetch, "/event/query", requestData(input)),
        ),
        act: mutation(
          {
            description: `Run one action on one or more security events (for example dismiss, or severityChange with a parameter). Take the exact actionName and actionParameter from events.get availableEventActions.${scopeNote}`,
            input: object({
              eventIds: array(string()),
              eventActionName: string(),
              eventActionParam: string().optional(),
              scope: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { eventIds, eventActionName, eventActionParam, scope }) =>
            post(
              fetch,
              "/action/event",
              requestData({ scope, eventIds, eventActionName: [eventActionName], eventActionParam: [eventActionParam ?? ""] }),
            ),
        ),
      },
      { title: "Security events", description: "Detected threats: search, inspect and act on them." },
    ),
    entities: router(
      {
        get: query(
          {
            description: "Get one secured SaaS entity (email, file or message) by its Avanan entity id, with related details.",
            input: object({ entityId: string() }),
          },
          async ({ fetch }, { entityId }) => get(fetch, `/search/entity/${seg(entityId)}`),
        ),
        search: query(
          {
            description:
              "Search secured entities. saas is required (office365_emails, office365_onedrive, office365_sharepoint, sharefile, slack, ms_teams, google_mail). saasEntity narrows the entity type. extendedFilter is a list of { saasAttrName, saasAttrOp, saasAttrValue } where saasAttrOp is one of is, contains, startsWith, isEmpty, isNot, notContains, isNotEmpty, greaterThan, lessThan, and saasAttrName is an entity attribute such as entityPayload.attachmentCount. Pass the scrollId from the previous response to fetch the next page.",
            input: object({
              saas: string(),
              saasEntity: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
              scopes: strings,
              extendedFilter: array(
                object({ saasAttrName: string(), saasAttrOp: string(), saasAttrValue: string().optional() }),
              ).optional(),
              scrollId: string().optional(),
            }),
          },
          async ({ fetch }, { saas, saasEntity, startDate, endDate, scopes, extendedFilter, scrollId }) =>
            post(
              fetch,
              "/search/query",
              requestData({
                scopes,
                entityFilter: { saas, saasEntity, startDate, endDate },
                entityExtendedFilter: extendedFilter,
                scrollId,
              }),
            ),
        ),
        act: mutation(
          {
            description: `Run one action (for example quarantine or restore) on one or more secured entities. The call returns a task id; poll tasks.get for the outcome.${scopeNote}`,
            input: object({
              entityIds: array(string()),
              entityActionName: string(),
              entityActionParam: string().optional(),
              scope: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { entityIds, entityActionName, entityActionParam, scope }) =>
            post(
              fetch,
              "/action/entity",
              requestData({ scope, entityIds, entityActionName: [entityActionName], entityActionParam: [entityActionParam ?? ""] }),
            ),
        ),
      },
      { title: "Secured entities", description: "Emails, files and messages protected by Avanan." },
    ),
    tasks: router(
      {
        get: query(
          {
            description: "Get the state of a queued event or entity action by the task id returned from an act call.",
            input: object({ taskId: string() }),
          },
          async ({ fetch }, { taskId }) => get(fetch, `/task/${seg(taskId)}`),
        ),
      },
      { title: "Tasks", description: "Status of queued actions." },
    ),
    exceptions: router(
      {
        list: query(
          {
            description: `List all exceptions of one type.${exceptionNote}`,
            input: object({ excType: exceptionType }),
          },
          async ({ fetch }, { excType }) => get(fetch, `/exceptions/${seg(excType)}`),
        ),
        get: query(
          {
            description: `Get one exception by type and id.${exceptionNote}`,
            input: object({ excType: exceptionType, excId: string() }),
          },
          async ({ fetch }, { excType, excId }) => get(fetch, `/exceptions/${seg(excType)}/${seg(excId)}`),
        ),
        create: mutation(
          {
            description: `Create an allow-list (Whitelist) or block-list (Blacklist) exception.${exceptionNote}`,
            input: object({ excType: exceptionType, ...exceptionBody }),
            approval: always(),
          },
          async ({ fetch }, { excType, ...data }) => post(fetch, `/exceptions/${seg(excType)}`, requestData(data)),
        ),
        update: mutation(
          {
            description: `Modify an existing exception.${exceptionNote}`,
            input: object({ excType: exceptionType, excId: string(), ...exceptionBody }),
            approval: always(),
          },
          async ({ fetch }, { excType, excId, ...data }) =>
            put(fetch, `/exceptions/${seg(excType)}/${seg(excId)}`, requestData(data)),
        ),
        delete: mutation(
          {
            description: `Delete an exception by type and id.${exceptionNote}`,
            input: object({ excType: exceptionType, excId: string() }),
            approval: always(),
          },
          async ({ fetch }, { excType, excId }) => post(fetch, `/exceptions/${seg(excType)}/delete/${seg(excId)}`),
        ),
      },
      { title: "Exceptions", description: "Allow-list and block-list rules." },
    ),
  });
};

export default defineApp({ user: { accounts: { avanan: avanan.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.avanan ?? [], (account) => avananTools(account, signal), { signal }), {
    title: "Avanan",
    description:
      "Check Point Harmony Email & Collaboration (Avanan): search and act on security events and secured emails, files and messages, and manage allow/block-list exceptions.",
    icons,
  }),
}));
