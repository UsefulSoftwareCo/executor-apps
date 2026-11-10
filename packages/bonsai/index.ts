import {
  accountRouter,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.bonsai.io";

const bonsai = defineProvider({
  name: "Bonsai",
  hosts: ["api.bonsai.io"],
  auth: {
    // API tokens are created in the Bonsai app and have a key and a secret, sent as HTTP Basic credentials.
    apiToken: secrets({
      label: "API token",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  // Cluster tools are the core of this package, so health uses GET /clusters (clusters:read).
  // Plans, spaces and releases need a separate account:read scope; a token without it still passes health.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/clusters`, {
      signal,
      headers: { Authorization: authorization(account.fields), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

function authorization(fields: { key: string; secret: string }) {
  return `Basic ${btoa(`${fields.key}:${fields.secret}`)}`;
}

type Fields = { key: string; secret: string };
type Fetch = typeof fetch;

function api(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search?: Record<string, unknown>, body?: Record<string, unknown>) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: authorization(fields),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  // Space paths look like omc/bonsai/us-east-1/common: encode each segment, keep the slashes.
  const spacePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

  return router({
    clusters: router({
      list: query(
        {
          description:
            "List active clusters (paginated). Optional q filters by name, tenancy is parent or child, location is an account, region, space or cluster path prefix, page and size paginate.",
          input: object({
            q: string().optional(),
            tenancy: string().optional(),
            location: string().optional(),
            page: string().optional(),
            size: string().optional(),
          }),
        },
        // The docs confirm only the response fields pagination.page_number/page_size; the page and size
        // request parameter names are an unverified assumption (the docs do not name them).
        (_ctx, args) => call("GET", "/clusters", { q: args.q, tenancy: args.tenancy, location: args.location, page: args.page, size: args.size }),
      ),
      get: query(
        { description: "Get one cluster by slug, with plan, release, space, stats, access and state.", input: object({ slug: string() }) },
        (_ctx, args) => call("GET", `/clusters/${encodeURIComponent(args.slug)}`),
      ),
      create: mutation(
        {
          description:
            "Create a cluster. name is required; plan is a plan slug, space a space path and release a release slug (see plans, spaces and releases). The 202 response includes the access credentials.",
          input: object({ name: string(), plan: string().optional(), space: string().optional(), release: string().optional() }),
        },
        (_ctx, args) => call("POST", "/clusters", undefined, { name: args.name, plan: args.plan, space: args.space, release: args.release }),
      ),
      update: mutation(
        {
          description: "Rename a cluster or change its plan by slug. Changing the plan may trigger a data migration.",
          input: object({ slug: string(), name: string().optional(), plan: string().optional() }),
        },
        (_ctx, args) => call("PUT", `/clusters/${encodeURIComponent(args.slug)}`, undefined, { name: args.name, plan: args.plan }),
      ),
      destroy: mutation(
        {
          description: "Permanently destroy a cluster and its data. name must exactly match the cluster's name (case sensitive), not its slug.",
          input: object({ slug: string(), name: string() }),
        },
        (_ctx, args) => call("DELETE", `/clusters/${encodeURIComponent(args.slug)}`, undefined, { name: args.name }),
      ),
    }),
    plans: router({
      list: query({ description: "List the plans available to the account, with price, tenancy, releases and spaces.", input: object({}) }, () => call("GET", "/plans")),
      get: query({ description: "Get one plan by slug.", input: object({ slug: string() }) }, (_ctx, args) =>
        call("GET", `/plans/${encodeURIComponent(args.slug)}`),
      ),
    }),
    spaces: router({
      list: query({ description: "List the spaces (regions and server groups) where clusters can be provisioned.", input: object({}) }, () =>
        call("GET", "/spaces"),
      ),
      get: query(
        { description: "Get one space by path, for example omc/bonsai/us-east-1/common.", input: object({ path: string() }) },
        (_ctx, args) => call("GET", `/spaces/${spacePath(args.path)}`),
      ),
    }),
    releases: router({
      list: query({ description: "List the Elasticsearch and OpenSearch releases available to the account.", input: object({}) }, () =>
        call("GET", "/releases"),
      ),
      get: query({ description: "Get one release by slug.", input: object({ slug: string() }) }, (_ctx, args) =>
        call("GET", `/releases/${encodeURIComponent(args.slug)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { bonsai: bonsai.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bonsai ?? [],
        (account) => withApprovals(api(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Bonsai",
        description: "Bonsai managed Elasticsearch and OpenSearch hosting: clusters, plans, regions and releases.",
        icons,
      },
    ),
  }),
);
