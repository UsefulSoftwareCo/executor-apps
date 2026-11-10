import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// IDnow iDCHECK.IO SDK-WEB REST API (https://sdkweb.idcheck.ariadnext.io/rest/api/index.html).
const servers = {
  production: {
    api: "https://sdkweb.idcheck.ariadnext.io/rest/v1/idcheckio-sdk-web",
    auth: "https://api.idcheck.ariadnext.io",
  },
  sandbox: {
    api: "https://sdkweb.idcheck-sandbox.ariadnext.io/rest/v1/idcheckio-sdk-web",
    auth: "https://api.idcheck-sandbox.ariadnext.io",
  },
} as const;

type Fields = { environment: string; client_id: string; username: string; password: string };

function server(environment: string) {
  const key = environment.trim().toLowerCase();
  if (key !== "production" && key !== "sandbox") throw new Error(`environment must be "production" or "sandbox", got "${environment}".`);
  return servers[key];
}

// The API uses an OAuth2 password grant against the customer-identity Keycloak realm.
const login = async (fields: Fields, fetcher: typeof fetch, signal?: AbortSignal) => {
  const response = await fetcher(`${server(fields.environment).auth}/auth/realms/customer-identity/protocol/openid-connect/token`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: fields.client_id,
      username: fields.username,
      password: fields.password,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string() }));
};

const identitycheck = defineProvider({
  name: "IdentityCheck",
  hosts: [
    "sdkweb.idcheck.ariadnext.io",
    "api.idcheck.ariadnext.io",
    "sdkweb.idcheck-sandbox.ariadnext.io",
    "api.idcheck-sandbox.ariadnext.io",
  ],
  auth: {
    // The vendor has no API keys or user-created OAuth apps: access is a customer account login (password grant).
    credentials: secrets({
      label: "iDCHECK.IO account login",
      fields: object({
        environment: string({ minLength: 1 }),
        client_id: string({ minLength: 1 }),
        username: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    // GET /monitoring/health is unauthenticated, so signing in is the only check of the credentials.
    await login(account.fields, fetch, signal);
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username } };
  },
});

type Params = Record<string, unknown>;

function client(base: string, token: () => Promise<string>, invalidate: () => Promise<void>, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "PUT" | "DELETE", path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 401) await invalidate();
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const payload = record(json());

function build(call: ReturnType<typeof client>) {
  const code = object({ code: string({ minLength: 1 }) });
  const withBody = object({ code: string({ minLength: 1 }), body: payload });
  return router({
    health: query(
      { description: "Check the SDK-WEB API's own health indicator. Reports UP or DOWN; it does not validate the account.", input: object({}) },
      async () => call("GET", "/monitoring/health"),
    ),
    configurations: router(
      {
        list: query({ description: "List all customer configurations (theme, wordings and options of the onboarding web app).", input: object({}) }, async () => call("GET", "/configuration")),
        get: query({ description: "Retrieve one configuration by its code.", input: code }, async (_c, input: { code: string }) => call("GET", `/configuration/${encodeURIComponent(input.code)}`)),
        create: mutation(
          {
            description:
              "Create a configuration. body is a CustomerConf: code and pathName (required), theme, wordings (each with a language), options (emailSenderName, linkValidity as an ISO 8601 duration, supportEmail, idCaptureSettings).",
            input: object({ body: payload }),
          },
          async (_c, input: { body: Params }) => call("POST", "/configuration", {}, input.body),
        ),
        update: mutation(
          { description: "Replace the configuration with this code. body is a full CustomerConf, as for create.", input: withBody },
          async (_c, input: { code: string; body: Params }) => call("PUT", `/configuration/${encodeURIComponent(input.code)}`, {}, input.body),
        ),
        delete: mutation({ description: "Delete a configuration by its code.", input: code }, async (_c, input: { code: string }) =>
          call("DELETE", `/configuration/${encodeURIComponent(input.code)}`),
        ),
      },
      { title: "Configurations", description: "Look and wording of the user onboarding web app." },
    ),
    notificationEndpoints: router(
      {
        list: query({ description: "List all webhook endpoints notified of onboarding events.", input: object({}) }, async () => call("GET", "/notification-endpoint")),
        get: query({ description: "Retrieve one webhook endpoint by its code.", input: code }, async (_c, input: { code: string }) =>
          call("GET", `/notification-endpoint/${encodeURIComponent(input.code)}`),
        ),
        create: mutation(
          {
            description:
              "Create a webhook endpoint. body: code (max 20 chars), url (public, max 256), subscribedEvents (START_ONBOARDING, END_ONBOARDING), optional securityHeaderField { name, value }, active, useSsl.",
            input: object({ body: payload }),
          },
          async (_c, input: { body: Params }) => call("POST", "/notification-endpoint", {}, input.body),
        ),
        update: mutation(
          { description: "Replace the webhook endpoint with this code. body has the same fields as create.", input: withBody },
          async (_c, input: { code: string; body: Params }) => call("PUT", `/notification-endpoint/${encodeURIComponent(input.code)}`, {}, input.body),
        ),
        delete: mutation({ description: "Delete a webhook endpoint by its code.", input: code }, async (_c, input: { code: string }) =>
          call("DELETE", `/notification-endpoint/${encodeURIComponent(input.code)}`),
        ),
      },
      { title: "Notification endpoints", description: "Webhook callbacks for onboarding events." },
    ),
    onboardings: router(
      {
        list: query(
          {
            description:
              "List onboarding sessions, paginated. Filters: uid, status, errorCode, dateFrom and dateTo (yyyy-MM-dd), notificationType, businessUid, businessFlow. page is zero-based.",
            input: object({
              uid: string().optional(),
              status: string().optional(),
              errorCode: string().optional(),
              dateFrom: string().optional(),
              dateTo: string().optional(),
              notificationType: string().optional(),
              businessUid: string().optional(),
              businessFlow: string().optional(),
              page: number().optional(),
            }),
          },
          async (_c, input: Params) => call("GET", "/onboarding", input),
        ),
        status: query(
          { description: "Retrieve the status and results of one onboarding by uid.", input: object({ uid: string({ minLength: 1 }) }) },
          async (_c, input: { uid: string }) => call("GET", `/onboarding/${encodeURIComponent(input.uid)}/status`),
        ),
        documentContent: query(
          {
            description: "Retrieve the base64 content of a document captured in an onboarding, by uid and docCode.",
            input: object({ uid: string({ minLength: 1 }), docCode: string({ minLength: 1 }) }),
          },
          async (_c, input: { uid: string; docCode: string }) =>
            call("GET", `/onboarding/${encodeURIComponent(input.uid)}/doccontent/${encodeURIComponent(input.docCode)}`),
        ),
        sendLink: mutation(
          {
            description:
              "Start an onboarding and send the capture link to a user. body is an OnboardingDefinition: contactData { notificationType (EMAIL or SMS), value }, plus the confCode, notification endpoint codes and documents to capture as in the vendor reference. Consumes account tokens.",
            input: object({ body: payload }),
          },
          async (_c, input: { body: Params }) => call("POST", "/onboarding/sendlink", {}, input.body),
        ),
        sendIpsLink: mutation(
          {
            description:
              "Start an identity proofing onboarding and send the capture link to a user (POST /onboarding-ips). body is an OnboardingIpsDefinition: identityProofingId, contactData { notificationType (EMAIL or SMS), value }, options, redirectionData, interfaceSettings { confCode, language, widgetConf }. Consumes account tokens.",
            input: object({ body: payload }),
          },
          async (_c, input: { body: Params }) => call("POST", "/onboarding-ips", {}, input.body),
        ),
      },
      { title: "Onboardings", description: "Identity document capture sessions and their results." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { identitycheck: identitycheck.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.identitycheck ?? [],
        async (account) => {
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "3 minutes", // Keycloak access tokens last about five minutes by default
              load: async ({ fetch, signal }) => (await login(account.fields, fetch, signal)).access_token,
            });
          const invalidate = () => sessions.invalidate(["token"]);
          return withApprovals(build(client(server(account.fields.environment).api, token, invalidate, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "IdentityCheck",
        description: "IDnow iDCHECK.IO identity verification: onboarding sessions, document capture results, configurations and webhook endpoints.",
        icons,
      },
    ),
  }),
);
