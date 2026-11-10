import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import type { AppCache } from "apps";
import { icons } from "./icon.js";

const apiBase = "https://api-business.apple.com";
// Apple's OAuth guide POSTs the client assertion to /auth/oauth2/token, while the JWT audience claim is the /auth/oauth2/v2/token URL.
const tokenUrl = "https://account.apple.com/auth/oauth2/token";
const tokenAudience = "https://account.apple.com/auth/oauth2/v2/token";

type Account = { id: string; fields: { clientId: string; keyId: string; privateKey: string } };

const apple = defineProvider({
  name: "Apple Business Manager",
  hosts: ["api-business.apple.com", "account.apple.com"],
  auth: {
    apiKey: secrets({
      label: "API account client ID, key ID and private key",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        keyId: plain(string({ minLength: 1 })),
        privateKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = await requestToken(fetch, account, signal);
    const response = await fetch(`${apiBase}/v1/mdmServers?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

const base64url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const encodeJson = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));

// The key downloaded from Apple Business is a PKCS#8 PEM ("BEGIN PRIVATE KEY") on P-256.
async function signingKey(pem: string) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  if (pem.includes("EC PRIVATE KEY")) {
    throw new Error("Paste the PKCS#8 private key (BEGIN PRIVATE KEY) downloaded from Apple Business.");
  }
  const der = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

// Client assertion: ES256 JWT with iss = sub = client ID, aud = the v2 token URL, kid = key ID.
async function clientAssertion(account: Account) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: account.fields.keyId.trim(), typ: "JWT" };
  const payload = {
    iss: account.fields.clientId.trim(),
    sub: account.fields.clientId.trim(),
    aud: tokenAudience,
    iat: now,
    exp: now + 15 * 60,
    jti: crypto.randomUUID(),
  };
  const signingInput = `${encodeJson(header)}.${encodeJson(payload)}`;
  const key = await signingKey(account.fields.privateKey);
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput)),
  );
  return `${signingInput}.${base64url(signature)}`;
}

async function requestToken(fetch: typeof globalThis.fetch, account: Account, signal: AbortSignal) {
  // Apple's documented request carries the parameters in the query string of the POST.
  const url = new URL(tokenUrl);
  url.search = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: account.fields.clientId.trim(),
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: await clientAssertion(account),
    scope: "business.api",
  }).toString();
  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
  });
  return (await decodeJson(response, object({ access_token: string({ minLength: 1 }) }))).access_token;
}

const listInput = {
  limit: number().optional(),
  cursor: string().optional(),
  fields: array(string()).optional(),
};
const pagingNote =
  " limit is the page size (Apple allows up to 1000). Page by passing meta.paging.nextCursor from the previous response as cursor. fields limits the returned attributes.";

const appleTools = (account: Account, cache: AppCache) => {
  const sessions = cache.forAccount(account);
  const token = () =>
    sessions.get({
      key: ["token"],
      schema: string(),
      freshFor: "30 minutes",
      load: ({ fetch, signal }) => requestToken(fetch, account, signal),
    });

  const call = async (
    fetch: typeof globalThis.fetch,
    method: "GET" | "POST",
    path: string,
    query: Record<string, string | number | undefined> = {},
    body?: unknown,
  ) => {
    const url = new URL(`${apiBase}${path}`);
    for (const [name, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(name, String(value));
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 401) await sessions.invalidate(["token"]);
    return decodeJson(response, json());
  };

  // Apple selects attributes with a fields[<resource type>] parameter.
  const page = (resource: string, input: { limit?: number; cursor?: string; fields?: readonly string[] }) => ({
    limit: input.limit,
    cursor: input.cursor,
    [`fields[${resource}]`]: input.fields?.join(","),
  });

  return router({
    devices: router(
      {
        list: query(
          {
            description: `List the devices in the organization (serial number, model, status, assignment, order details).${pagingNote}`,
            input: object(listInput),
          },
          async ({ fetch }, input) => call(fetch, "GET", "/v1/orgDevices", page("orgDevices", input)),
        ),
        get: query(
          {
            description: "Get one organization device by its id (the device serial number).",
            input: object({ deviceId: string({ minLength: 1 }), fields: array(string()).optional() }),
          },
          async ({ fetch }, { deviceId, fields }) =>
            call(fetch, "GET", `/v1/orgDevices/${encodeURIComponent(deviceId)}`, page("orgDevices", { fields })),
        ),
        assignedServer: query(
          {
            description: "Get the MDM server a device is currently assigned to.",
            input: object({ deviceId: string({ minLength: 1 }), fields: array(string()).optional() }),
          },
          async ({ fetch }, { deviceId, fields }) =>
            call(fetch, "GET", `/v1/orgDevices/${encodeURIComponent(deviceId)}/assignedServer`, page("mdmServers", { fields })),
        ),
        activationLock: query(
          {
            description: "Get the Activation Lock status of a device.",
            input: object({ deviceId: string({ minLength: 1 }), fields: array(string()).optional() }),
          },
          async ({ fetch }, { deviceId, fields }) =>
            call(fetch, "GET", `/v1/orgDevices/${encodeURIComponent(deviceId)}/activationLockStatus`, page("activationLockStatus", { fields })),
        ),
        appleCareCoverage: query(
          {
            description: `List the AppleCare coverage resources for a device. limit is the page size.`,
            input: object({ deviceId: string({ minLength: 1 }), limit: number().optional(), fields: array(string()).optional() }),
          },
          async ({ fetch }, { deviceId, ...input }) =>
            call(fetch, "GET", `/v1/orgDevices/${encodeURIComponent(deviceId)}/appleCareCoverage`, page("appleCareCoverage", input)),
        ),
      },
      { title: "Devices", description: "Devices purchased by or added to the organization." },
    ),
    mdmServers: router(
      {
        list: query(
          {
            description: `List the device management (MDM) servers in the organization.${pagingNote}`,
            input: object(listInput),
          },
          async ({ fetch }, input) => call(fetch, "GET", "/v1/mdmServers", page("mdmServers", input)),
        ),
        devices: query(
          {
            description: `List the device ids assigned to an MDM server.${pagingNote}`,
            input: object({ serverId: string({ minLength: 1 }), limit: number().optional(), cursor: string().optional() }),
          },
          async ({ fetch }, { serverId, ...input }) =>
            call(fetch, "GET", `/v1/mdmServers/${encodeURIComponent(serverId)}/relationships/devices`, input),
        ),
      },
      { title: "MDM servers", description: "Device management servers that devices can be assigned to." },
    ),
    users: router(
      {
        list: query(
          { description: `List the users in the organization.${pagingNote}`, input: object(listInput) },
          async ({ fetch }, input) => call(fetch, "GET", "/v1/users", page("users", input)),
        ),
        get: query(
          {
            description: "Get one user by id.",
            input: object({ userId: string({ minLength: 1 }), fields: array(string()).optional() }),
          },
          async ({ fetch }, { userId, fields }) =>
            call(fetch, "GET", `/v1/users/${encodeURIComponent(userId)}`, page("users", { fields })),
        ),
      },
      { title: "Users", description: "People in the organization." },
    ),
    auditEvents: router(
      {
        list: query(
          {
            description: `List audit events between two ISO 8601 timestamps. Optional filters: actorId, subjectId, type.${pagingNote}`,
            input: object({
              startTimestamp: string({ minLength: 1 }),
              endTimestamp: string({ minLength: 1 }),
              actorId: string().optional(),
              subjectId: string().optional(),
              type: string().optional(),
              ...listInput,
            }),
          },
          async ({ fetch }, input) =>
            call(fetch, "GET", "/v1/auditEvents", {
              ...page("auditEvents", input),
              "filter[startTimestamp]": input.startTimestamp,
              "filter[endTimestamp]": input.endTimestamp,
              "filter[actorId]": input.actorId,
              "filter[subjectId]": input.subjectId,
              "filter[type]": input.type,
            }),
        ),
      },
      { title: "Audit events", description: "Audit log of actions in the organization." },
    ),
    activities: router(
      {
        get: query(
          {
            description: "Get the status of a device assignment activity by id.",
            input: object({ activityId: string({ minLength: 1 }), fields: array(string()).optional() }),
          },
          async ({ fetch }, { activityId, fields }) =>
            call(fetch, "GET", `/v1/orgDeviceActivities/${encodeURIComponent(activityId)}`, page("orgDeviceActivities", { fields })),
        ),
        assign: mutation(
          {
            description:
              "Assign devices to an MDM server. Returns an activity; poll activities.get for its status.",
            input: object({ serverId: string({ minLength: 1 }), deviceIds: array(string({ minLength: 1 })) }),
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", "/v1/orgDeviceActivities", {}, activityBody("ASSIGN_DEVICES", input)),
        ),
        unassign: mutation(
          {
            description:
              "Unassign devices from an MDM server. Returns an activity; poll activities.get for its status.",
            input: object({ serverId: string({ minLength: 1 }), deviceIds: array(string({ minLength: 1 })) }),
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", "/v1/orgDeviceActivities", {}, activityBody("UNASSIGN_DEVICES", input)),
        ),
      },
      { title: "Activities", description: "Assign devices to, or unassign them from, MDM servers." },
    ),
  });
};

const activityBody = (activityType: string, input: { serverId: string; deviceIds: readonly string[] }) => ({
  data: {
    type: "orgDeviceActivities",
    attributes: { activityType },
    relationships: {
      mdmServer: { data: { type: "mdmServers", id: input.serverId } },
      devices: { data: input.deviceIds.map((id) => ({ type: "orgDevices", id })) },
    },
  },
});

export default defineApp(
  { user: { accounts: { apple: apple.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.apple ?? [], (account) => appleTools(account, cache), { signal }),
      {
        title: "Apple Business Manager",
        description: "Organization devices, MDM servers and device assignment activities in Apple Business Manager.",
        icons,
      },
    ),
  }),
);
