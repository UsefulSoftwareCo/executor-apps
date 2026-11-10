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
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Beeminder drops POST parameters on the redirect from beeminder.com, so always use www.
const base = "https://www.beeminder.com/api/v1";

const beeminder = defineProvider({
  name: "Beeminder",
  hosts: ["www.beeminder.com"],
  auth: {
    apiKey: secrets({
      label: "Personal auth token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me.json?auth_token=${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ username: string() }));
    return { accountInfo: { externalId: me.username, displayName: me.username } };
  },
});

type Params = Record<string, string | number | boolean | readonly string[] | undefined>;
type Fetch = typeof globalThis.fetch;

const enc = encodeURIComponent;
const form = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    // Arrays use Rails-style repeated key[] parameters; an empty array sends a blank tags[] to clear.
    if (Array.isArray(value)) {
      if (value.length === 0) out.append(`${key}[]`, "");
      for (const item of value) out.append(`${key}[]`, item);
    } else out.set(key, String(value));
  }
  return out;
};

const tools = (token: string, signal: AbortSignal) => {
  const call = async (
    fetch: Fetch,
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    params: Params = {},
  ) => {
    const body = form({ ...params, auth_token: token });
    const withQuery = method === "GET" || method === "DELETE";
    const response = await fetch(withQuery ? `${base}${path}?${body}` : `${base}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(withQuery ? {} : { "content-type": "application/x-www-form-urlencoded" }),
      },
      body: withQuery ? undefined : body,
    });
    return decodeJson(response, json());
  };
  const user = object({ username: string().optional() });
  const goal = object({ username: string().optional(), goal: string() });
  const goalNoUser = (u: string | undefined) => enc(u ?? "me");
  const g = (i: { username?: string | undefined; goal: string }) => `/users/${goalNoUser(i.username)}/goals/${enc(i.goal)}`;
  const u = (i: { username?: string | undefined }) => `/users/${goalNoUser(i.username)}`;
  const usernameNote = " username defaults to the authenticated user (me).";

  return router({
    users: router(
      {
        get: query(
          {
            description:
              "Get a user. Set associations=true to include goals, set diff_since (unix timestamp) for incremental sync, skinny/emaciated for smaller goal objects." +
              usernameNote,
            input: object({
              username: string().optional(),
              associations: boolean().optional(),
              diff_since: number().optional(),
              skinny: boolean().optional(),
              emaciated: boolean().optional(),
              datapoints_count: number().optional(),
            }),
          },
          async ({ fetch }, { username, ...rest }) => call(fetch, "GET", `${u({ username })}.json`, rest),
        ),
      },
      { title: "Users", description: "The authenticated Beeminder user." },
    ),
    goals: router(
      {
        list: query(
          {
            description: "List a user's active goals. emaciated=true returns minimal goal objects." + usernameNote,
            input: object({ username: string().optional(), emaciated: boolean().optional() }),
          },
          async ({ fetch }, { username, ...rest }) => call(fetch, "GET", `${u({ username })}/goals.json`, rest),
        ),
        listArchived: query(
          {
            description: "List a user's archived goals." + usernameNote,
            input: object({ username: string().optional(), emaciated: boolean().optional() }),
          },
          async ({ fetch }, { username, ...rest }) => call(fetch, "GET", `${u({ username })}/goals/archived.json`, rest),
        ),
        get: query(
          {
            description: "Get one goal by slug. datapoints=true includes its datapoints." + usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              datapoints: boolean().optional(),
              emaciated: boolean().optional(),
            }),
          },
          async ({ fetch }, { username, goal: slug, ...rest }) => call(fetch, "GET", `${g({ username, goal: slug })}.json`, rest),
        ),
        create: mutation(
          {
            description:
              "Create a goal. goal_type is hustler, biker, fatloser, gainer, inboxer or drinker. Supply exactly two of goaldate, goalval and rate (the third may be null). gunits is the unit label (e.g. 'hours'). Set dryrun=true to test without creating the goal; false or omitted creates it." +
              usernameNote,
            input: object({
              username: string().optional(),
              slug: string(),
              title: string(),
              goal_type: string(),
              gunits: string(),
              goaldate: number().optional(),
              goalval: number().optional(),
              rate: number().optional(),
              initval: number().optional(),
              secret: boolean().optional(),
              datapublic: boolean().optional(),
              datasource: string().optional(),
              dryrun: boolean().optional(),
              tags: array(string()).optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, tags, dryrun, ...rest }) =>
            call(fetch, "POST", `${u({ username })}/goals.json`, { ...rest, tags, dryrun: dryrun ? true : undefined }),
        ),
        update: mutation(
          {
            description:
              "Update a goal's title, yaxis label, tmin/tmax, secret, datapublic, roadall (the full road as a JSON array of [date, value, rate] rows), datasource or tags." +
              usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              title: string().optional(),
              yaxis: string().optional(),
              tmin: string().optional(),
              tmax: string().optional(),
              secret: boolean().optional(),
              datapublic: boolean().optional(),
              roadall: json().optional(),
              datasource: string().optional(),
              tags: array(string()).optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, roadall, tags, ...rest }) =>
            call(fetch, "PUT", `${g({ username, goal: slug })}.json`, {
              ...rest,
              roadall: roadall === undefined ? undefined : JSON.stringify(roadall),
              tags,
            }),
        ),
        refreshGraph: query(
          {
            description: "Queue a regeneration of the goal's graph image (a GET with a harmless side effect: it only re-renders the image). Use sparingly." + usernameNote,
            input: goal,
          },
          async ({ fetch }, input) => call(fetch, "GET", `${g(input)}/refresh_graph.json`),
        ),
        shortCircuit: mutation(
          {
            description: "Short circuit a goal: charges the current pledge immediately and raises the pledge level." + usernameNote,
            input: goal,
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${g(input)}/shortcircuit.json`),
        ),
        stepDown: mutation(
          {
            description: "Schedule a pledge step-down for the goal (takes effect after the akrasia horizon)." + usernameNote,
            input: goal,
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${g(input)}/stepdown.json`),
        ),
        cancelStepDown: mutation(
          {
            description: "Cancel a pending pledge step-down." + usernameNote,
            input: goal,
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${g(input)}/cancel_stepdown.json`),
        ),
        uncle: mutation(
          {
            description: "Derail a red goal immediately (uncle): accept the charge now. Only valid when the goal is in the red." + usernameNote,
            input: goal,
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${g(input)}/uncleme.json`),
        ),
        ratchet: mutation(
          {
            description:
              "Ratchet a goal's safety buffer down to newsafety days. beemergency is required when newsafety is 0." + usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              newsafety: number(),
              beemergency: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, ...rest }) => call(fetch, "POST", `${g({ username, goal: slug })}/ratchet.json`, rest),
        ),
        dialRoad: mutation(
          {
            description:
              "Deprecated by Beeminder: change the yellow brick road by supplying two of rate, goaldate and goalval. Prefer goals.update with roadall." +
              usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              rate: number().optional(),
              goaldate: number().optional(),
              goalval: number().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, ...rest }) => call(fetch, "POST", `${g({ username, goal: slug })}/dial_road.json`, rest),
        ),
      },
      { title: "Goals", description: "Goals: create, update, list, graph refresh and pledge controls." },
    ),
    datapoints: router(
      {
        list: query(
          {
            description:
              "List a goal's datapoints. sort is the attribute to sort by (default id, newest first). count limits results; page and per paginate." +
              usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              sort: string().optional(),
              count: number().optional(),
              page: number().optional(),
              per: number().optional(),
            }),
          },
          async ({ fetch }, { username, goal: slug, ...rest }) => call(fetch, "GET", `${g({ username, goal: slug })}/datapoints.json`, rest),
        ),
        create: mutation(
          {
            description:
              "Add a datapoint to a goal. value is required; timestamp (unix) or daystamp (YYYYMMDD) set the date; requestid makes the call an idempotent upsert." +
              usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              value: number(),
              timestamp: number().optional(),
              daystamp: string().optional(),
              comment: string().optional(),
              requestid: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, ...rest }) => call(fetch, "POST", `${g({ username, goal: slug })}/datapoints.json`, rest),
        ),
        createAll: mutation(
          {
            description:
              "Add several datapoints in one call. datapoints is an array of objects with value and optional timestamp, daystamp, comment and requestid." +
              usernameNote,
            input: object({ username: string().optional(), goal: string(), datapoints: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, datapoints }) =>
            call(fetch, "POST", `${g({ username, goal: slug })}/datapoints/create_all.json`, { datapoints: JSON.stringify(datapoints) }),
        ),
        update: mutation(
          {
            description: "Update a datapoint's timestamp, value or comment by id." + usernameNote,
            input: object({
              username: string().optional(),
              goal: string(),
              id: string(),
              timestamp: number().optional(),
              value: number().optional(),
              comment: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, id, ...rest }) =>
            call(fetch, "PUT", `${g({ username, goal: slug })}/datapoints/${enc(id)}.json`, rest),
        ),
        delete: mutation(
          {
            description: "Delete a datapoint by id." + usernameNote,
            input: object({ username: string().optional(), goal: string(), id: string() }),
            approval: always(),
          },
          async ({ fetch }, { username, goal: slug, id }) =>
            call(fetch, "DELETE", `${g({ username, goal: slug })}/datapoints/${enc(id)}.json`),
        ),
      },
      { title: "Datapoints", description: "Datapoints recorded against goals." },
    ),
    charges: router(
      {
        create: mutation(
          {
            description:
              "Charge the user real money (amount at least 1.00 USD) with a note. Needs a token with charge access. Set dryrun=true to return the charge without actually creating it; omit it (or false) to really charge.",
            input: object({ user_id: string(), amount: number(), note: string().optional(), dryrun: boolean().optional() }),
            approval: always(),
          },
          async ({ fetch }, { dryrun, ...rest }) =>
            // Beeminder treats the mere presence of dryrun as a dry run, so only send it when true.
            call(fetch, "POST", "/charges.json", { ...rest, dryrun: dryrun ? true : undefined }),
        ),
      },
      { title: "Charges", description: "Manual charges against the user's account." },
    ),
  });
};

export default defineApp({ user: { accounts: { beeminder: beeminder.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.beeminder ?? [], (account) => tools(account.fields.token, signal), { signal }),
    {
      title: "Beeminder",
      description: "Track goals with Beeminder: users, goals, datapoints and charges.",
      icons,
    },
  ),
}));
