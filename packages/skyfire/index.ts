import {
  accountRouter,
  array,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.skyfire.xyz";

const skyfire = defineProvider({
  name: "Skyfire",
  hosts: ["api.skyfire.xyz"],
  auth: {
    apiKey: secrets({
      label: "API key (agent or organization admin)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Agent keys may read the wallet balance; organization admin keys are rejected there
  // and may only call organization endpoints, so fall back to listing one user.
  async health({ account, fetch, signal }) {
    const headers = { "skyfire-api-key": account.fields.token };
    const agent = await fetch(`${base}/api/v1/agents/balance`, { signal, headers });
    if (agent.ok) return;
    const organization = await fetch(`${base}/api/v1/organizations/users?pageSize=1`, { signal, headers });
    if (organization.ok) return;
    throw new Error(`Skyfire rejected the API key (${agent.status} on balance, ${organization.status} on organization users)`);
  },
});

type Fetch = typeof fetch;
type Call = (
  method: string,
  path: string,
  options?: { query?: Record<string, string | number | undefined>; body?: unknown },
) => Promise<unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, options = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { "skyfire-api-key": token };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Skyfire ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`);
    return text ? (JSON.parse(text) as unknown) : null;
  };
}

const id = (value: string) => encodeURIComponent(value);

function build(call: Call) {
  return router({
    tokens: router(
      {
        create: mutation(
          {
            description:
              "Buyer agent key. Create a kya, pay or kya-pay token. Give sellerServiceId for an onboarded seller (from the directory), or sellerDomainOrUrl for an external seller (organization buyer keys only, kya tokens only). tokenAmount is a decimal string in USD and is required for pay and kya-pay; it is reserved from the wallet. expiresAt is a Unix timestamp in seconds. Returns { token } (a JWT).",
            input: object({
              type: string({ minLength: 1 }),
              buyerTag: string().optional(),
              tokenAmount: string().optional(),
              sellerServiceId: string().optional(),
              sellerDomainOrUrl: string().optional(),
              expiresAt: number().optional(),
              identityPermissions: array(string()).optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/api/v1/tokens", { body: input }),
        ),
        charge: mutation(
          {
            description:
              "Seller agent key. Charge a pay or kya-pay token after delivering the service. chargeAmount is a decimal string in USD; omit it to charge the service price. Moves real funds.",
            input: object({ token: string({ minLength: 1 }), chargeAmount: string().optional() }),
          },
          async (_ctx, input) => call("POST", "/api/v1/tokens/charge", { body: input }),
        ),
        introspect: query(
          {
            description: "Buyer or seller agent key. Check whether a token is currently usable and get its remaining balance.",
            input: object({ token: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/api/v1/tokens/introspect", { body: input }),
        ),
        charges: query(
          {
            description:
              "Buyer or seller agent key. List the charges made on a pay or kya-pay token. tokenId is the token's jti claim. Paginate with pageCursor from the previous nextPageCursor.",
            input: object({ tokenId: string({ minLength: 1 }), size: number().optional(), pageCursor: string().optional() }),
          },
          async (_ctx, { tokenId, size, pageCursor }) =>
            call("GET", `/api/v1/tokens/${id(tokenId)}/charges`, { query: { size, pageCursor } }),
        ),
      },
      { title: "Tokens", description: "Create, charge and inspect KYA, pay and kya-pay tokens." },
    ),
    agent: router(
      {
        walletBalance: query(
          { description: "Get the wallet balance of the agent that owns the API key.", input: object({}) },
          async () => call("GET", "/api/v1/agents/balance"),
        ),
        sourceIps: query(
          { description: "Get the source IP addresses configured for the agent.", input: object({}) },
          async () => call("GET", "/api/v1/agents/source-ips"),
        ),
        setSourceIps: mutation(
          {
            description: "Replace the agent's source IP addresses with the given list.",
            input: object({ ipAddresses: array(string()) }),
          },
          async (_ctx, { ipAddresses }) => call("PUT", "/api/v1/agents/source-ips", { body: ipAddresses }),
        ),
      },
      { title: "Agent", description: "The agent that owns the API key: wallet balance and source IPs." },
    ),
    sellerServices: router(
      {
        list: query(
          { description: "Seller agent key. List all of the seller agent's services.", input: object({}) },
          async () => call("GET", "/api/v1/agents/seller-services"),
        ),
        get: query(
          {
            description: "Seller agent key. Get one of the seller agent's services.",
            input: object({ sellerServiceId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sellerServiceId }) => call("GET", `/api/v1/agents/seller-services/${id(sellerServiceId)}`),
        ),
        create: mutation(
          {
            description:
              "Seller agent key. Create a seller service. type is one of API, WEB_PAGE, MCP_SERVER_REMOTE, MCP_SERVER_LOCAL, FETCH_AGENT; priceModel is PAY_PER_USE, SUBSCRIPTION, PAY_PER_MB or CUSTOM. price and minimumTokenAmount are decimal strings. Set mcpServerUrl, openApiSpecUrl, websiteUrl or fetchAgentProfileUrl to match the type. humanIdentityRequirement, termsOfService and acceptedTokens are objects/arrays as in the Skyfire reference. A new service must be approved before it can be activated.",
            input: object({
              name: string({ minLength: 1 }),
              description: string({ minLength: 1 }),
              tags: array(string()),
              type: string({ minLength: 1 }),
              price: string({ minLength: 1 }),
              priceModel: string({ minLength: 1 }),
              minimumTokenAmount: string({ minLength: 1 }),
              humanIdentityRequirement: json(),
              mcpServerUrl: string().optional(),
              openApiSpecUrl: string().optional(),
              websiteUrl: string().optional(),
              fetchAgentProfileUrl: string().optional(),
              termsOfService: json().optional(),
              acceptedTokens: array(string()).optional(),
              maxTokenTTLSeconds: number().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/api/v1/agents/seller-services", { body: input }),
        ),
        update: mutation(
          {
            description: "Seller agent key. Update fields of a seller service; omitted fields are unchanged.",
            input: object({
              sellerServiceId: string({ minLength: 1 }),
              name: string().optional(),
              description: string().optional(),
              tags: array(string()).optional(),
              minimumTokenAmount: string().optional(),
              price: string().optional(),
              termsOfService: json().optional(),
              acceptedTokens: array(string()).optional(),
            }),
          },
          async (_ctx, { sellerServiceId, ...body }) =>
            call("PATCH", `/api/v1/agents/seller-services/${id(sellerServiceId)}`, { body }),
        ),
        activate: mutation(
          {
            description: "Seller agent key. Activate an approved seller service so buyers can find it.",
            input: object({ sellerServiceId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sellerServiceId }) => call("POST", `/api/v1/agents/seller-services/${id(sellerServiceId)}/activate`),
        ),
        deactivate: mutation(
          {
            description: "Seller agent key. Deactivate a seller service.",
            input: object({ sellerServiceId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sellerServiceId }) => call("POST", `/api/v1/agents/seller-services/${id(sellerServiceId)}/deactivate`),
        ),
      },
      { title: "Seller services", description: "Manage the services a seller agent offers." },
    ),
    directory: router(
      {
        services: query(
          { description: "List all approved and active services in the Skyfire Directory.", input: object({}) },
          async () => call("GET", "/api/v1/directory/services"),
        ),
        service: query(
          { description: "Get one directory service by ID (a UUID).", input: object({ serviceId: string({ minLength: 1 }) }) },
          async (_ctx, { serviceId }) => call("GET", `/api/v1/directory/services/${id(serviceId)}`),
        ),
        tags: query(
          { description: "List all tags that directory services can be searched by.", input: object({}) },
          async () => call("GET", "/api/v1/directory/tags"),
        ),
        searchByTags: query(
          {
            description: "Find directory services matching a comma-delimited list of tags, for example \"seller,service\".",
            input: object({ commaDelimitedTags: string({ minLength: 1 }) }),
          },
          async (_ctx, { commaDelimitedTags }) => call("GET", "/api/v1/directory/services/search", { query: { commaDelimitedTags } }),
        ),
        servicesByAgent: query(
          {
            description: "List the directory services belonging to one agent (agentId is a UUID).",
            input: object({ agentId: string({ minLength: 1 }) }),
          },
          async (_ctx, { agentId }) => call("GET", `/api/v1/directory/agents/${id(agentId)}/services`),
        ),
      },
      { title: "Directory", description: "Discover seller services in the Skyfire Directory." },
    ),
    organization: router(
      {
        listUsers: query(
          {
            description:
              "Organization admin key. List users in the organization. filter is a JSON object encoded as a string; pageCursor comes from the previous nextPageCursor. pageSize defaults to 100, maximum 1000.",
            input: object({ pageSize: number().optional(), pageCursor: string().optional(), filter: string().optional() }),
          },
          async (_ctx, query) => call("GET", "/api/v1/organizations/users", { query }),
        ),
        getUser: query(
          {
            description: "Organization admin key. Get a user by ID (a UUID).",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId }) => call("GET", `/api/v1/organizations/users/${id(userId)}`),
        ),
        getUserByEmail: query(
          {
            description: "Organization admin key. Get a user by exact, case-insensitive email address.",
            input: object({ email: string({ minLength: 3 }) }),
          },
          async (_ctx, { email }) => call("GET", `/api/v1/organizations/users/email/${id(email)}`),
        ),
        createUser: mutation(
          {
            description: "Organization admin key. Create a user in the organization. role is MEMBER or ADMIN.",
            input: object({ email: string({ minLength: 3 }), role: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/api/v1/organizations/users", { body: input }),
        ),
        setUserPersonalData: mutation(
          {
            description:
              "Organization admin key. Set personal data (identity fields such as person.firstName) for a user. data is an object; every field in it is optional. See the Skyfire identity-fields reference.",
            input: object({ userId: string({ minLength: 1 }), data: json() }),
          },
          async (_ctx, { userId, data }) =>
            call("POST", `/api/v1/organizations/users/${id(userId)}/personal-data`, { body: { data } }),
        ),
        activateUser: mutation(
          {
            description: "Organization admin key. Reactivate a deactivated user.",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId }) => call("PATCH", `/api/v1/organizations/users/${id(userId)}/activate`),
        ),
        deactivateUser: mutation(
          {
            description: "Organization admin key. Deactivate a user.",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId }) => call("PATCH", `/api/v1/organizations/users/${id(userId)}/deactivate`),
        ),
        createUserSessionToken: mutation(
          {
            description: "Organization admin key. Create a short-lived session token for a user in the organization.",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/api/v1/auth/skyfire-session-token", { body: input }),
        ),
        createSellerAgent: mutation(
          {
            description: "Organization admin key. Create a seller agent for an organization user.",
            input: object({ userId: string({ minLength: 1 }), displayName: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId, displayName }) =>
            call("POST", `/api/v1/organizations/users/${id(userId)}/agents/seller`, { body: { displayName } }),
        ),
        listAgentApiKeys: query(
          {
            description: "Organization admin key. List the API keys of an agent owned by an organization user.",
            input: object({
              userId: string({ minLength: 1 }),
              agentId: string({ minLength: 1 }),
              pageSize: number().optional(),
              pageCursor: string().optional(),
            }),
          },
          async (_ctx, { userId, agentId, pageSize, pageCursor }) =>
            call("GET", `/api/v1/organizations/users/${id(userId)}/agents/${id(agentId)}/api-keys`, { query: { pageSize, pageCursor } }),
        ),
        createAgentApiKey: mutation(
          {
            description: "Organization admin key. Create an API key for an agent owned by an organization user. The new key value is in the response.",
            input: object({ userId: string({ minLength: 1 }), agentId: string({ minLength: 1 }), notes: string().optional() }),
          },
          async (_ctx, { userId, agentId, notes }) =>
            call("POST", `/api/v1/organizations/users/${id(userId)}/agents/${id(agentId)}/api-keys`, { body: { notes } }),
        ),
        activateAgentApiKey: mutation(
          {
            description: "Organization admin key. Re-enable a deactivated agent API key.",
            input: object({ userId: string({ minLength: 1 }), agentId: string({ minLength: 1 }), apiKeyId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId, agentId, apiKeyId }) =>
            call("PATCH", `/api/v1/organizations/users/${id(userId)}/agents/${id(agentId)}/api-keys/${id(apiKeyId)}/activate`),
        ),
        deactivateAgentApiKey: mutation(
          {
            description: "Organization admin key. Disable an agent API key; keys are never deleted.",
            input: object({ userId: string({ minLength: 1 }), agentId: string({ minLength: 1 }), apiKeyId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId, agentId, apiKeyId }) =>
            call("PATCH", `/api/v1/organizations/users/${id(userId)}/agents/${id(agentId)}/api-keys/${id(apiKeyId)}/deactivate`),
        ),
      },
      { title: "Organization", description: "Organization admin: users, seller agents and agent API keys." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { skyfire: skyfire.many() } }, icons },
  async ({ user, signal, fetch }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.skyfire ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Skyfire",
        description:
          "Skyfire agent payments and identity: create and charge KYA and pay tokens, manage seller services and the wallet, browse the service directory and administer organization users.",
        instructions:
          "Skyfire has one API key header but three key roles. Buyer agent keys create tokens; seller agent keys charge tokens and manage seller services; organization admin keys manage users. A tool's description names the key role it needs; a key of the wrong role is rejected. Connect one account per key. The directory tools need no Skyfire key, but still run through a connected account.",
        icons,
      },
    ),
  }),
);
