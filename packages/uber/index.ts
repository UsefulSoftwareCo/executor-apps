import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.uber.com/v1.2";

const uber = defineProvider({
  name: "Uber",
  hosts: ["api.uber.com"],
  auth: {
    // Uber has no client registration: the connect page asks for the client of an app made at developer.uber.com/dashboard.
    oauth: oauth2({
      authorizationUrl: "https://auth.uber.com/oauth/v2/authorize",
      tokenUrl: "https://auth.uber.com/oauth/v2/token",
      revocationUrl: "https://auth.uber.com/oauth/v2/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["profile", "history", "places", "offline_access", "request", "request_receipt"],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, object({ uuid: string() }));
    return { accountInfo: { externalId: me.uuid, displayName: "Uber rider" } };
  },
});

type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>;

const Id = (name: string) => object({ [name]: string() });

function build(call: Call) {
  const get = (description: string, path: string, extra: Record<string, ReturnType<typeof string>> = {}) =>
    query({ description, input: object({ ...extra }) }, async (_c, a: Params) => call("GET", fill(path, a), {}, undefined));
  const getQ = (description: string, path: string, shape: Record<string, any>) =>
    query({ description, input: object(shape) }, async (_c, a: Params) => {
      const { ...rest } = a;
      return call("GET", fill(path, a), pick(rest, path), undefined);
    });
  const send = (method: string, description: string, path: string, shape: Record<string, any>, hasBody = true) =>
    mutation({ description, input: object({ ...shape, ...(hasBody ? { body: record(json()).optional() } : {}) }) }, async (_c, a: Params) =>
      call(method, fill(path, a), {}, hasBody ? (a.body as Params | undefined) ?? {} : undefined),
    );
  void Id;
  const loc = {
    start_latitude: number(),
    start_longitude: number(),
  };
  return router({
    products: router({
      list: getQ("List Uber products available at a location.", "/products", { latitude: number(), longitude: number() }),
      get: get("Get details of one product.", "/products/{product_id}", { product_id: string() }),
    }),
    estimates: router({
      price: getQ("Price estimates for a trip between two points.", "/estimates/price", {
        ...loc,
        end_latitude: number(),
        end_longitude: number(),
        seat_count: number().optional(),
      }),
      time: getQ("Pickup time estimates at a location.", "/estimates/time", {
        ...loc,
        product_id: string().optional(),
      }),
    }),
    me: router({
      get: get("Profile of the authorized user (scope profile).", "/me"),
      applyPromotion: send("PATCH", "Apply a promotion code to the user's account. Pass body {applied_promotion_codes}.", "/me", {}),
      history: getQ("Trip history of the user (scope history).", "/history", {
        limit: number().optional(),
        offset: number().optional(),
      }),
      paymentMethods: get("List the user's payment methods.", "/payment-methods"),
    }),
    places: router({
      get: get("Get a saved place (home or work; scope places).", "/places/{place_id}", { place_id: string() }),
      update: send("PUT", "Update a saved place. Pass body {address}.", "/places/{place_id}", { place_id: string() }),
    }),
    requests: router({
      estimate: send(
        "POST",
        "Estimate a ride request (fare, pickup ETA). Pass body with product_id, start/end coordinates, etc. Scope request.",
        "/requests/estimate",
        {},
      ),
      create: send(
        "POST",
        "Request a ride on the user's behalf. Pass body with product_id, start/end coordinates, fare_id, payment_method_id, etc. Scope request.",
        "/requests",
        {},
      ),
      get: get("Details and status of a ride request.", "/requests/{request_id}", { request_id: string() }),
      cancel: send("DELETE", "Cancel a ride request.", "/requests/{request_id}", { request_id: string() }, false),
      update: send("PATCH", "Update a ride request, for example its destination. Pass body.", "/requests/{request_id}", {
        request_id: string(),
      }),
      map: get("Get a tracking map link for an in-progress request.", "/requests/{request_id}/map", { request_id: string() }),
      receipt: get("Receipt of a completed request (scope request_receipt).", "/requests/{request_id}/receipt", {
        request_id: string(),
      }),
    }),
  });
}

function fill(path: string, args: Params): string {
  return path.replace(/\{([a-z_]+)\}/g, (_m, key: string) => encodeURIComponent(String(args[key])));
}

// Everything not a path parameter or body goes in the query string.
function pick(args: Params, path: string): Params {
  const ids = new Set([...path.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]!));
  return Object.fromEntries(Object.entries(args).filter(([key]) => !ids.has(key)));
}

export default defineApp(
  { user: { accounts: { uber: uber.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.uber ?? [],
        async (account) => {
          const call: Call = async (method, path, search, body) => {
            const url = new URL(`${base}${path}`);
            for (const [key, value] of Object.entries(search)) {
              if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
            }
            const response = await fetch(url.toString(), {
              method,
              signal,
              headers: {
                Authorization: `Bearer ${account.fields.access_token}`,
                "Accept-Language": "en_US",
                ...(body === undefined ? {} : { "Content-Type": "application/json" }),
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
            if (response.status === 204) return { ok: true };
            return decodeJson(response, json());
          };
          return withApprovals(build(call), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "Uber",
        description: "Uber Riders API: products, estimates, ride requests, trip history, saved places and payment methods.",
        icons,
      },
    ),
  }),
);
