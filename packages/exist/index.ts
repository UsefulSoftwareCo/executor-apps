import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://exist.io/api/2";

const exist = defineProvider({
  name: "Exist",
  hosts: ["exist.io"],
  auth: {
    // Exist "simple token": the user exchanges username and password at POST /api/2/auth/simple-token/ (outside Executor); read access only (writes need OAuth2). Exist may deprecate it.
    token: secrets({
      label: "Personal token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Exist has no dynamic client registration: the user creates a client manually at exist.io/account/apps/ and enters it on the connect page.
    oauth: oauth2({
      authorizationUrl: "https://exist.io/oauth2/authorize",
      tokenUrl: "https://exist.io/oauth2/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "activity_read",
        "productivity_read",
        "mood_read",
        "sleep_read",
        "workouts_read",
        "events_read",
        "finance_read",
        "food_read",
        "health_read",
        "location_read",
        "media_read",
        "social_read",
        "weather_read",
        "symptoms_read",
        "medication_read",
        "custom_read",
        "manual_read",
        "activity_write",
        "productivity_write",
        "mood_write",
        "sleep_write",
        "workouts_write",
        "events_write",
        "finance_write",
        "food_write",
        "health_write",
        "location_write",
        "media_write",
        "social_write",
        "weather_write",
        "symptoms_write",
        "medication_write",
        "custom_write",
        "manual_write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/accounts/profile/`, { signal, headers: authorization(account) });
    const me = await decodeJson(response, object({ username: string() }));
    return { accountInfo: { externalId: me.username, username: me.username } };
  },
});

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

function authorization(account: Account) {
  return {
    Authorization: account.method === "oauth" ? `Bearer ${account.fields.access_token}` : `Token ${account.fields.token}`,
  };
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = authorization(account);
  return {
    get: async (path: string, params: Params = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      return decodeJson(await fetcher(url.toString(), { headers, signal }), json());
    },
    post: async (path: string, body: unknown, params: Params = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      // Batch writes answer 202 when some items failed; the body still lists them under "failed".
      const response = await fetcher(url.toString(), {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      return decodeJson(response, json());
    },
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const name = () => string({ minLength: 1 });

const paging = { page: optNum(), limit: optNum() };
const filters = {
  groups: optStr(),
  attributes: optStr(),
  exclude_custom: optBool(),
  manual: optBool(),
  include_inactive: optBool(),
  include_low_priority: optBool(),
};

function build(api: ReturnType<typeof client>) {
  const attributes = router(
    {
      list: query(
        {
          description:
            "List the user's attributes (without values). groups and attributes are comma-separated filters; owned=true limits to attributes this OAuth client owns.",
          input: object({ ...paging, ...filters, owned: optBool() }),
        },
        (_c, p) => api.get("/attributes/", p),
      ),
      templates: query(
        {
          description: "List the attribute templates Exist supports (name, label, group, value type).",
          input: object({ ...paging, include_low_priority: optBool(), groups: optStr() }),
        },
        (_c, p) => api.get("/attributes/templates/", p),
      ),
      withValues: query(
        {
          description:
            "List attributes with their recent daily values. days (max 31, default 1) counts back from date_max (YYYY-mm-dd). Use attributes or templates, not both.",
          input: object({
            ...paging,
            days: optNum(),
            date_max: optStr(),
            groups: optStr(),
            attributes: optStr(),
            templates: optStr(),
            manual: optBool(),
          }),
        },
        (_c, p) => api.get("/attributes/with-values/", p),
      ),
      values: query(
        {
          description: "Get the daily values of one attribute, newest first. limit is at most 100; date_max is YYYY-mm-dd.",
          input: object({ attribute: name(), limit: optNum(), page: optNum(), date_max: optStr() }),
        },
        (_c, p) => api.get("/attributes/values/", p),
      ),
      owned: query(
        {
          description: "List the attributes this OAuth client owns and may write values for.",
          input: object({ ...paging, ...filters }),
        },
        (_c, p) => api.get("/attributes/owned/", p),
      ),
      acquire: mutation(
        {
          description:
            "Take ownership of attributes so this client can write them (OAuth only, up to 35 per call). Use template for templated attributes such as mood (creates it if missing) or name for any attribute.",
          input: object({
            attributes: array(object({ template: optStr(), name: optStr(), manual: optBool() })),
            success_objects: optBool(),
          }),
        },
        (_c, { attributes: items, success_objects }) =>
          api.post("/attributes/acquire/", items, { success_objects: success_objects === true ? 1 : undefined }),
      ),
      release: mutation(
        {
          description: "Give up ownership of attributes this client acquired (OAuth only, up to 35 per call).",
          input: object({ attributes: array(object({ name: name() })) }),
        },
        (_c, { attributes: items }) => api.post("/attributes/release/", items),
      ),
      update: mutation(
        {
          description:
            "Set attribute values for given days (OAuth only, up to 35 per call). The value replaces the stored total for that day. Attributes must be owned; value is a string, integer or float matching the attribute's value type; date is the user's local YYYY-mm-dd.",
          input: object({
            attributes: array(object({ name: name(), date: name(), value: json() })),
          }),
        },
        (_c, { attributes: items }) => api.post("/attributes/update/", items),
      ),
      increment: mutation(
        {
          description:
            "Add deltas to owned numeric attributes (OAuth only, up to 35 per call). Not allowed for string, scale or time-of-day attributes. date defaults to today.",
          input: object({
            attributes: array(object({ name: name(), value: number(), date: optStr() })),
          }),
        },
        (_c, { attributes: items }) => api.post("/attributes/increment/", items),
      ),
    },
    { title: "Attributes", description: "Tracked attributes, their templates, daily values, and writing data to owned attributes." },
  );

  return router({
    profile: query(
      { description: "Get the authenticated user's profile: username, timezone, local time and unit preferences.", input: object({}) },
      () => api.get("/accounts/profile/"),
    ),
    attributes,
    averages: query(
      {
        description:
          "Weekly averages per attribute, overall and by day of week. date_min/date_max are YYYY-mm-dd; include_historical with attributes returns several records per attribute.",
        input: object({
          ...paging,
          date_min: optStr(),
          date_max: optStr(),
          groups: optStr(),
          attributes: optStr(),
          include_historical: optBool(),
        }),
      },
      (_c, p) => api.get("/averages/", p),
    ),
    correlations: router(
      {
        list: query(
          {
            description: "Correlations Exist found in the past week. strong and confident (1) filter by strength and five-star confidence.",
            input: object({ ...paging, strong: optNum(), confident: optNum(), attribute: optStr() }),
          },
          (_c, p) => api.get("/correlations/", p),
        ),
        combo: query(
          {
            description: "Correlation between two attributes, in either order. Fails with 404 when none is found.",
            input: object({ attribute: name(), attribute2: name() }),
          },
          (_c, p) => api.get("/correlations/combo/", p),
        ),
      },
      { title: "Correlations", description: "Relationships Exist found between pairs of tracked attributes." },
    ),
    insights: query(
      {
        description: "Insights for the user, newest first. priority runs from 1 (today) to 4 (last month); dates are YYYY-mm-dd.",
        input: object({ ...paging, date_min: optStr(), date_max: optStr(), priority: optNum() }),
      },
      (_c, p) => api.get("/insights/", p),
    ),
  });
}

export default defineApp(
  { user: { accounts: { exist: exist.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.exist ?? [],
        (account) =>
          withApprovals(build(client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Exist",
        description:
          "Personal analytics: read tracked attributes and daily values, averages, correlations and insights, and write values to owned attributes.",
        icons,
        instructions:
          "Writing (attributes.acquire, release, update, increment) needs an OAuth connection whose client was granted the matching <group>_write scopes at exist.io/account/apps/; a personal token is read-only. Acquire an attribute before writing it. Dates are the user's local day, YYYY-mm-dd.",
      },
    ),
  }),
);
