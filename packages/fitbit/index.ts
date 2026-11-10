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

const base = "https://health.googleapis.com/v4";
const scope = "https://www.googleapis.com/auth/googlehealth.";

const fitbit = defineProvider({
  name: "Fitbit",
  hosts: ["health.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        `${scope}activity_and_fitness.readonly`,
        `${scope}activity_and_fitness.writeonly`,
        `${scope}health_metrics_and_measurements.readonly`,
        `${scope}health_metrics_and_measurements.writeonly`,
        `${scope}sleep.readonly`,
        `${scope}sleep.writeonly`,
        `${scope}nutrition.writeonly`,
        `${scope}profile.readonly`,
        `${scope}profile.writeonly`,
        `${scope}settings.readonly`,
        `${scope}settings.writeonly`,
      ],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me/identity`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const identity = await decodeJson(response, object({ healthUserId: string() }));
    return { accountInfo: { externalId: identity.healthUserId } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>;

const dataType = string({ minLength: 1 });
const listParams = {
  dataType,
  filter: string().optional(),
  pageSize: number().optional(),
  pageToken: string().optional(),
  dataSourceFamily: string().optional(),
};
const user = string().optional();

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const me = (args: Params) => `users/${encodeURIComponent((args.user as string | undefined) ?? "me")}`;
  const type = (args: Params) => `${me(args)}/dataTypes/${encodeURIComponent(String(args.dataType))}`;
  const rest = (args: Params, keys: string[]) =>
    Object.fromEntries(keys.map((key) => [key, args[key]] as const));

  const userNote = "user defaults to me (the authenticated user); a numeric Health user id also works.";
  const points = "Data type ids are kebab-case, e.g. steps, heart-rate, sleep, exercise, weight, distance, floors, active-zone-minutes, daily-resting-heart-rate, oxygen-saturation, vo2-max, body-fat, food, nutrition-log.";

  return router({
    profile: router({
      get: query(
        { description: "Get the user's profile (age, height, membership and similar). " + userNote, input: object({ user }) },
        async (_c, a) => call("GET", `${me(a)}/profile`, {}, undefined),
      ),
      update: mutation(
        {
          description: "Update the user's profile. Pass the Profile fields in body and the comma-separated fields to change in updateMask.",
          input: object({ user, updateMask: string().optional(), body: record(json()) }),
        },
        async (_c, a) => call("PATCH", `${me(a)}/profile`, rest(a, ["updateMask"]), a.body as Params),
      ),
    }),
    settings: router({
      get: query(
        { description: "Get the user's settings: units, timezone and locale. " + userNote, input: object({ user }) },
        async (_c, a) => call("GET", `${me(a)}/settings`, {}, undefined),
      ),
      update: mutation(
        {
          description: "Update the user's settings. Pass the Settings fields in body and the comma-separated fields to change in updateMask.",
          input: object({ user, updateMask: string().optional(), body: record(json()) }),
        },
        async (_c, a) => call("PATCH", `${me(a)}/settings`, rest(a, ["updateMask"]), a.body as Params),
      ),
    }),
    identity: router({
      get: query(
        { description: "Get the user's Health user id and the legacy Fitbit user id (for mapping old Fitbit data).", input: object({ user }) },
        async (_c, a) => call("GET", `${me(a)}/identity`, {}, undefined),
      ),
      getIrnProfile: query(
        { description: "Get the user's irregular rhythm notification profile.", input: object({ user }) },
        async (_c, a) => call("GET", `${me(a)}/irnProfile`, {}, undefined),
      ),
    }),
    devices: router({
      list: query(
        {
          description: "List the user's paired Fitbit and Google devices.",
          input: object({ user, pageSize: number().optional(), pageToken: string().optional() }),
        },
        async (_c, a) => call("GET", `${me(a)}/pairedDevices`, rest(a, ["pageSize", "pageToken"]), undefined),
      ),
    }),
    dataPoints: router({
      list: query(
        {
          description:
            "List raw data points of one type, newest first, tagged by source device. Narrow with filter, e.g. steps.interval.civil_start_time >= \"2026-01-01\" AND steps.interval.civil_start_time < \"2026-01-02\" (sleep uses sleep.interval.civil_end_time, daily summaries use <type>.date). " +
            points,
          input: object({ user, ...listParams }),
        },
        async (_c, a) => call("GET", `${type(a)}/dataPoints`, rest(a, ["filter", "pageSize", "pageToken", "dataSourceFamily"]), undefined),
      ),
      reconcile: query(
        {
          description:
            "Read one data type merged and deduplicated across sources (use this for sleep and for totals). Same filter syntax as dataPoints.list. " + points,
          input: object({ user, ...listParams }),
        },
        async (_c, a) => call("GET", `${type(a)}/dataPoints:reconcile`, rest(a, ["filter", "pageSize", "pageToken", "dataSourceFamily"]), undefined),
      ),
      get: query(
        {
          description: "Get one data point by resource name, e.g. users/me/dataTypes/exercise/dataPoints/<id>.",
          input: object({ name: string({ minLength: 1 }) }),
        },
        async (_c, a) => call("GET", String(a.name), {}, undefined),
      ),
      rollUp: query(
        {
          description:
            "Aggregate a data type over time windows. Body: { range: { startTime, endTime } or civil range, windowSize: \"3600s\", pageSize?, pageToken?, dataSourceFamily? }. " + points,
          input: object({ user, dataType, body: record(json()) }),
        },
        async (_c, a) => call("POST", `${type(a)}/dataPoints:rollUp`, {}, a.body as Params),
      ),
      dailyRollUp: query(
        {
          description:
            "Aggregate a data type per civil day. Body: { range: civil start and end dates, windowSizeDays?, pageSize?, pageToken?, dataSourceFamily? }. " + points,
          input: object({ user, dataType, body: record(json()) }),
        },
        async (_c, a) => call("POST", `${type(a)}/dataPoints:dailyRollUp`, {}, a.body as Params),
      ),
      exportExerciseTcx: query(
        {
          description: "Export an exercise as TCX. name is the exercise data point resource name; set partialData to include partial data.",
          input: object({ name: string({ minLength: 1 }), partialData: string().optional() }),
        },
        async (_c, a) => call("GET", `${String(a.name)}:exportExerciseTcx`, rest(a, ["partialData"]), undefined),
      ),
      create: mutation(
        {
          description: "Create a data point (log a weight, exercise, food, etc.). body is a DataPoint with the matching data type field. " + points,
          input: object({ user, dataType, body: record(json()) }),
        },
        async (_c, a) => call("POST", `${type(a)}/dataPoints`, {}, a.body as Params),
      ),
      patch: mutation(
        {
          description: "Update a data point by resource name. body is the DataPoint with the changed fields.",
          input: object({ name: string({ minLength: 1 }), body: record(json()) }),
        },
        async (_c, a) => call("PATCH", String(a.name), {}, a.body as Params),
      ),
      batchDelete: mutation(
        {
          description: "Delete data points of one type. Body: { names: [data point resource names] }.",
          input: object({ user, dataType, body: record(json()) }),
        },
        async (_c, a) => call("POST", `${type(a)}/dataPoints:batchDelete`, {}, a.body as Params),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { fitbit: fitbit.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fitbit ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fitbit",
        description:
          "Fitbit and Google Health data: steps, sleep, heart rate, exercise, weight, nutrition, profile, settings and paired devices.",
        instructions:
          "Uses the Google Health API, which replaced the Fitbit Web API (shut down 30 October 2026). Users sign in with a Google account linked to Fitbit. Use dataPoints.list for raw points, dataPoints.reconcile for merged data and the rollUp tools for aggregates.",
        icons,
      },
    ),
  }),
);
