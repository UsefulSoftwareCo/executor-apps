import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  raw,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const duo = defineProvider({
  name: "Cisco Duo Admin",
  hosts: ["*.duosecurity.com", "*.duofederal.com"],
  auth: {
    // Create an "Admin API" application in the Duo Admin Panel (Applications > Protect an Application).
    // Every request is signed (HMAC-SHA1) with the secret key, so the app must be able to read it.
    apiKey: secrets({
      label: "Admin API application",
      fields: object({
        hostname: plain(string({ minLength: 1 })),
        integrationKey: plain(string({ minLength: 1 })),
        secretKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await signedFetch(account, fetch, signal, "GET", "/admin/v1/info/summary", {});
    await decodeJson(response, object({ stat: string() }));
  },
});

type Account = { fields: { hostname: string; integrationKey: string; secretKey: string } };
type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

const encoder = new TextEncoder();

// Duo percent-encodes everything except letters, digits and _ . ~ -, with uppercase hex.
const encode = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

const canonicalParams = (params: Params) =>
  Object.entries(params)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => [encode(key), encode(String(value))] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const apiHost = (hostname: string) => {
  const host = hostname.trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/+$/, "");
  if (!/^api-[a-z0-9]+\.(duosecurity|duofederal)\.com$/.test(host)) {
    throw new Error(`Unexpected Duo API hostname: ${hostname} (expected api-xxxxxxxx.duosecurity.com)`);
  }
  return host;
};

// Signature version 2 (documented at https://duo.com/docs/adminapi#authentication).
async function signedFetch(
  account: Account,
  fetchImpl: Fetch,
  signal: AbortSignal | undefined,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Params,
): Promise<Response> {
  const host = apiHost(account.fields.hostname);
  const date = new Date().toUTCString().replace("GMT", "-0000");
  const body = canonicalParams(params);
  const canonical = [date, method, host, path, body].join("\n");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(account.fields.secretKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(canonical)));
  const headers: Record<string, string> = {
    Date: date,
    Authorization: `Basic ${btoa(`${account.fields.integrationKey}:${signature}`)}`,
    Accept: "application/json",
  };
  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return fetchImpl(`https://${host}${path}`, { method, signal, headers, body });
  }
  return fetchImpl(`https://${host}${path}${body === "" ? "" : `?${body}`}`, { method, signal, headers });
}

const segment = (value: string) => encodeURIComponent(value);

const page = {
  limit: number().optional(),
  offset: number().optional(),
};

const duoTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetchImpl: Fetch,
    method: "GET" | "POST" | "DELETE",
    path: string,
    params: Params = {},
  ) => decodeJson(await signedFetch(account, fetchImpl, signal, method, path, params), json());

  return router({
    info: router(
      {
        summary: query(
          {
            description:
              "Account summary: counts of users, admins, integrations, phones and tokens (admin_count, integration_count, telephony_credits_remaining, user_count).",
            input: object({}),
          },
          ({ fetch }) => call(fetch, "GET", "/admin/v1/info/summary"),
        ),
        authenticationAttempts: query(
          {
            description:
              "Authentication attempt counts by result (SUCCESS, FAILURE, ERROR, FRAUD...) over the last 30 days or a given period. mintime and maxtime are Unix seconds; you may also filter by users, integrations or factors (comma-separated ids/names).",
            input: object({
              mintime: number().optional(),
              maxtime: number().optional(),
              users: string().optional(),
              integrations: string().optional(),
              factors: string().optional(),
            }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/info/authentication_attempts", input),
        ),
        telephonyCreditsUsed: query(
          {
            description: "Telephony credits used per day over a Unix-second time range (mintime, maxtime).",
            input: object({ mintime: number().optional(), maxtime: number().optional() }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v2/info/telephony_credits_used", input),
        ),
      },
      { title: "Info" },
    ),
    users: router(
      {
        list: query(
          {
            description:
              "List users. limit defaults to 100 (max 300). Filter by exact username or email. Pass offset from the previous metadata.next_offset to page.",
            input: object({ ...page, username: string().optional(), email: string().optional() }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/users", input),
        ),
        get: query(
          { description: "Get one user by user_id (the DU... id).", input: object({ userId: string() }) },
          ({ fetch }, { userId }) => call(fetch, "GET", `/admin/v1/users/${segment(userId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a user. status is active, bypass or disabled (default active). Returns the new user.",
            input: object({
              username: string(),
              email: string().optional(),
              realname: string().optional(),
              firstname: string().optional(),
              lastname: string().optional(),
              status: string().optional(),
              notes: string().optional(),
              alias1: string().optional(),
              alias2: string().optional(),
              alias3: string().optional(),
              alias4: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => call(fetch, "POST", "/admin/v1/users", input),
        ),
        update: mutation(
          {
            description:
              "Update a user's attributes. status is active, bypass or disabled. Only the fields you pass change.",
            input: object({
              userId: string(),
              username: string().optional(),
              email: string().optional(),
              realname: string().optional(),
              firstname: string().optional(),
              lastname: string().optional(),
              status: string().optional(),
              notes: string().optional(),
              alias1: string().optional(),
              alias2: string().optional(),
              alias3: string().optional(),
              alias4: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { userId, ...params }) => call(fetch, "POST", `/admin/v1/users/${segment(userId)}`, params),
        ),
        delete: mutation(
          {
            description: "Permanently delete a user (skips the Trash).",
            input: object({ userId: string() }),
            approval: always(),
          },
          ({ fetch }, { userId }) => call(fetch, "DELETE", `/admin/v1/users/${segment(userId)}`),
        ),
        enroll: mutation(
          {
            description:
              "Enroll a user and email them an enrollment link. Creates the user when the username does not exist. valid_secs is how long the link lasts (default 2592000, the maximum).",
            input: object({ username: string(), email: string(), validSecs: number().optional() }),
            approval: always(),
          },
          ({ fetch }, { validSecs, ...input }) =>
            call(fetch, "POST", "/admin/v1/users/enroll", { ...input, valid_secs: validSecs }),
        ),
        groups: query(
          {
            description: "List the groups a user belongs to.",
            input: object({ userId: string(), ...page }),
          },
          ({ fetch }, { userId, ...params }) => call(fetch, "GET", `/admin/v1/users/${segment(userId)}/groups`, params),
        ),
        addGroup: mutation(
          {
            description: "Add a user to a group.",
            input: object({ userId: string(), groupId: string() }),
            approval: always(),
          },
          ({ fetch }, { userId, groupId }) =>
            call(fetch, "POST", `/admin/v1/users/${segment(userId)}/groups`, { group_id: groupId }),
        ),
        removeGroup: mutation(
          {
            description: "Remove a user from a group.",
            input: object({ userId: string(), groupId: string() }),
            approval: always(),
          },
          ({ fetch }, { userId, groupId }) =>
            call(fetch, "DELETE", `/admin/v1/users/${segment(userId)}/groups/${segment(groupId)}`),
        ),
        phones: query(
          { description: "List the phones associated with a user.", input: object({ userId: string(), ...page }) },
          ({ fetch }, { userId, ...params }) => call(fetch, "GET", `/admin/v1/users/${segment(userId)}/phones`, params),
        ),
        addPhone: mutation(
          {
            description: "Associate an existing phone with a user.",
            input: object({ userId: string(), phoneId: string() }),
            approval: always(),
          },
          ({ fetch }, { userId, phoneId }) =>
            call(fetch, "POST", `/admin/v1/users/${segment(userId)}/phones`, { phone_id: phoneId }),
        ),
        removePhone: mutation(
          {
            description: "Disassociate a phone from a user (the phone itself is kept).",
            input: object({ userId: string(), phoneId: string() }),
            approval: always(),
          },
          ({ fetch }, { userId, phoneId }) =>
            call(fetch, "DELETE", `/admin/v1/users/${segment(userId)}/phones/${segment(phoneId)}`),
        ),
        tokens: query(
          { description: "List the hardware tokens associated with a user.", input: object({ userId: string(), ...page }) },
          ({ fetch }, { userId, ...params }) => call(fetch, "GET", `/admin/v1/users/${segment(userId)}/tokens`, params),
        ),
        webauthnCredentials: query(
          { description: "List a user's WebAuthn credentials.", input: object({ userId: string() }) },
          ({ fetch }, { userId }) => call(fetch, "GET", `/admin/v1/users/${segment(userId)}/webauthncredentials`),
        ),
        bypassCodes: query(
          {
            description: "List a user's bypass code records (the codes themselves are not returned).",
            input: object({ userId: string(), ...page }),
          },
          ({ fetch }, { userId, ...params }) =>
            call(fetch, "GET", `/admin/v1/users/${segment(userId)}/bypass_codes`, params),
        ),
        createBypassCodes: mutation(
          {
            description:
              "Generate bypass codes for a user. count is up to 10; valid_secs is the lifetime in seconds (0 never expires); reuse_count is how many times each code works (0 unlimited, default 1). The new codes are returned once.",
            input: object({
              userId: string(),
              count: number().optional(),
              validSecs: number().optional(),
              reuseCount: number().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { userId, validSecs, reuseCount, ...params }) =>
            call(fetch, "POST", `/admin/v1/users/${segment(userId)}/bypass_codes`, {
              ...params,
              valid_secs: validSecs,
              reuse_count: reuseCount,
            }),
        ),
      },
      { title: "Users" },
    ),
    groups: router(
      {
        list: query(
          { description: "List groups.", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/groups", input),
        ),
        get: query(
          { description: "Get one group by group_id.", input: object({ groupId: string() }) },
          ({ fetch }, { groupId }) => call(fetch, "GET", `/admin/v1/groups/${segment(groupId)}`),
        ),
        create: mutation(
          {
            description: "Create a group. status is Active, Bypass or Disabled (default Active).",
            input: object({ name: string(), desc: string().optional(), status: string().optional() }),
            approval: always(),
          },
          ({ fetch }, input) => call(fetch, "POST", "/admin/v1/groups", input),
        ),
        update: mutation(
          {
            description: "Update a group's name, description or status.",
            input: object({
              groupId: string(),
              name: string().optional(),
              desc: string().optional(),
              status: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { groupId, ...params }) => call(fetch, "POST", `/admin/v1/groups/${segment(groupId)}`, params),
        ),
        delete: mutation(
          {
            description: "Delete a group.",
            input: object({ groupId: string() }),
            approval: always(),
          },
          ({ fetch }, { groupId }) => call(fetch, "DELETE", `/admin/v1/groups/${segment(groupId)}`),
        ),
        users: query(
          { description: "List the users in a group.", input: object({ groupId: string(), ...page }) },
          ({ fetch }, { groupId, ...params }) => call(fetch, "GET", `/admin/v2/groups/${segment(groupId)}/users`, params),
        ),
      },
      { title: "Groups" },
    ),
    phones: router(
      {
        list: query(
          {
            description: "List phones. Filter by exact number or extension.",
            input: object({ ...page, number: string().optional(), extension: string().optional() }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/phones", input),
        ),
        get: query(
          { description: "Get one phone by phone_id.", input: object({ phoneId: string() }) },
          ({ fetch }, { phoneId }) => call(fetch, "GET", `/admin/v1/phones/${segment(phoneId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a phone. type is Unknown, Mobile or Landline; platform is e.g. google android, apple ios, generic smartphone.",
            input: object({
              number: string().optional(),
              name: string().optional(),
              extension: string().optional(),
              type: string().optional(),
              platform: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => call(fetch, "POST", "/admin/v1/phones", input),
        ),
        delete: mutation(
          {
            description: "Delete a phone.",
            input: object({ phoneId: string() }),
            approval: always(),
          },
          ({ fetch }, { phoneId }) => call(fetch, "DELETE", `/admin/v1/phones/${segment(phoneId)}`),
        ),
        activationUrl: mutation(
          {
            description:
              "Generate a Duo Mobile activation URL and barcode for a smartphone. valid_secs defaults to 86400; install=1 includes the app install link.",
            input: object({ phoneId: string(), validSecs: number().optional(), install: number().optional() }),
            approval: always(),
          },
          ({ fetch }, { phoneId, validSecs, install }) =>
            call(fetch, "POST", `/admin/v1/phones/${segment(phoneId)}/activation_url`, {
              valid_secs: validSecs,
              install,
            }),
        ),
        sendSmsActivation: mutation(
          {
            description: "Text a Duo Mobile activation link to a phone (consumes telephony credits).",
            input: object({ phoneId: string(), validSecs: number().optional(), install: number().optional() }),
            approval: always(),
          },
          ({ fetch }, { phoneId, validSecs, install }) =>
            call(fetch, "POST", `/admin/v1/phones/${segment(phoneId)}/send_sms_activation`, {
              valid_secs: validSecs,
              install,
            }),
        ),
      },
      { title: "Phones" },
    ),
    tokens: router(
      {
        list: query(
          {
            description: "List hardware tokens. Filter by type (e.g. t6, d100, yk) and serial.",
            input: object({ ...page, type: string().optional(), serial: string().optional() }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/tokens", input),
        ),
        get: query(
          { description: "Get one hardware token by token_id.", input: object({ tokenId: string() }) },
          ({ fetch }, { tokenId }) => call(fetch, "GET", `/admin/v1/tokens/${segment(tokenId)}`),
        ),
        delete: mutation(
          {
            description: "Delete a hardware token.",
            input: object({ tokenId: string() }),
            approval: always(),
          },
          ({ fetch }, { tokenId }) => call(fetch, "DELETE", `/admin/v1/tokens/${segment(tokenId)}`),
        ),
      },
      { title: "Tokens" },
    ),
    admins: router(
      {
        list: query(
          { description: "List administrators.", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/admins", input),
        ),
        get: query(
          { description: "Get one administrator by admin_id.", input: object({ adminId: string() }) },
          ({ fetch }, { adminId }) => call(fetch, "GET", `/admin/v1/admins/${segment(adminId)}`),
        ),
      },
      { title: "Administrators" },
    ),
    integrations: router(
      {
        list: query(
          { description: "List protected applications (integrations).", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v3/integrations", input),
        ),
        get: query(
          {
            description: "Get one integration by its integration key (DI...). Secret keys are not returned.",
            input: object({ integrationKey: string() }),
          },
          ({ fetch }, { integrationKey }) => call(fetch, "GET", `/admin/v3/integrations/${segment(integrationKey)}`),
        ),
      },
      { title: "Integrations" },
    ),
    policies: router(
      {
        list: query(
          { description: "List policies.", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v2/policies", input),
        ),
        get: query(
          { description: "Get one policy by policy_key.", input: object({ policyKey: string() }) },
          ({ fetch }, { policyKey }) => call(fetch, "GET", `/admin/v2/policies/${segment(policyKey)}`),
        ),
      },
      { title: "Policies" },
    ),
    devices: router(
      {
        endpoints: query(
          { description: "List endpoints (devices that have accessed Duo-protected applications).", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/endpoints", input),
        ),
        registeredDevices: query(
          { description: "List Duo Desktop registered devices.", input: object({ ...page }) },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/registered_devices", input),
        ),
      },
      { title: "Devices" },
    ),
    logs: router(
      {
        authentication: query(
          {
            description:
              "Authentication logs (v2). mintime and maxtime are Unix milliseconds (maxtime must be at least 2 minutes old, at most 180 days back). limit up to 1000. For the next page pass next_offset values from metadata as nextOffset (format 'ms,id').",
            input: object({
              mintime: number(),
              maxtime: number(),
              limit: number().optional(),
              nextOffset: string().optional(),
              sort: string().optional(),
              users: string().optional(),
              applications: string().optional(),
              results: string().optional(),
              factors: string().optional(),
            }),
          },
          ({ fetch }, { nextOffset, ...params }) =>
            call(fetch, "GET", "/admin/v2/logs/authentication", { ...params, next_offset: nextOffset }),
        ),
        administrator: query(
          {
            description: "Administrator action logs. mintime is Unix seconds; returns the most recent 1000 entries since then.",
            input: object({ mintime: number().optional() }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/admin/v1/logs/administrator", input),
        ),
        telephony: query(
          {
            description:
              "Telephony logs (v2). mintime and maxtime are Unix milliseconds; limit up to 1000; nextOffset pages as for authentication logs.",
            input: object({
              mintime: number(),
              maxtime: number(),
              limit: number().optional(),
              nextOffset: string().optional(),
              sort: string().optional(),
            }),
          },
          ({ fetch }, { nextOffset, ...params }) =>
            call(fetch, "GET", "/admin/v2/logs/telephony", { ...params, next_offset: nextOffset }),
        ),
      },
      { title: "Logs" },
    ),
    settings: query(
      {
        description: "Get the account's global settings (lockout, timezone, caller id, fraud email, etc.).",
        input: object({}),
      },
      ({ fetch }) => call(fetch, "GET", "/admin/v1/settings"),
    ),
  });
};

export default defineApp({ user: { accounts: { duo: duo.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.duo ?? [], (account) => duoTools(account, signal), { signal }), {
    title: "Cisco Duo Admin",
    description:
      "Manage Duo users, groups, phones, tokens, bypass codes, administrators, integrations and policies, and read authentication, administrator and telephony logs through the Duo Admin API.",
    icons,
  }),
}));
