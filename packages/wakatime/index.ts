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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.wakatime.com/api/v1";

const wakatime = defineProvider({
  name: "WakaTime",
  hosts: ["api.wakatime.com", "wakatime.com"],
  auth: {
    // The secret API key from https://wakatime.com/settings/api-key, sent as HTTP Basic.
    apiKey: secrets({
      label: "Secret API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // WakaTime offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://wakatime.com/oauth/authorize",
      tokenUrl: "https://wakatime.com/oauth/token",
      revocationUrl: "https://wakatime.com/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "email",
        "read_summaries",
        "read_stats",
        "read_goals",
        "read_orgs",
        "read_private_leaderboards",
        "read_heartbeats",
        "write_heartbeats",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/current`, { signal, headers: authHeaders(account) });
    const me = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: me.data.id } };
  },
});

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

function authHeaders(account: Account): Record<string, string> {
  return {
    Authorization:
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(account.fields.token)}`,
  };
}

type Params = Record<string, unknown>;

function client(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const segment = (value: string) => encodeURIComponent(value);
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  const send = async (method: string, path: string, params: Params = {}, body?: unknown) =>
    decodeJson(
      await fetcher(url(path, params), {
        method,
        signal,
        headers: { ...authHeaders(account), ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );
  return {
    segment,
    get: (path: string, params?: Params) => send("GET", path, params),
    post: (path: string, body: unknown) => send("POST", path, {}, body),
    put: (path: string, body: unknown) => send("PUT", path, {}, body),
    del: (path: string, params?: Params, body?: unknown) => send("DELETE", path, params, body),
  };
}

const optString = () => string().optional();
const user = optString();
const userPath = (c: ReturnType<typeof client>, u: string | undefined) => `/users/${c.segment(u ?? "current")}`;

function tools(c: ReturnType<typeof client>) {
  const p = (u: string | undefined) => userPath(c, u);
  return router({
    users: router({
      get: query(
        {
          description: "Profile of a user (default: the current user), including plan, timezone and public stats settings.",
          input: object({ user }),
        },
        async (_ctx, { user }) => c.get(p(user)),
      ),
    }),
    summaries: router({
      get: query(
        {
          description:
            "Daily coding summaries (projects, languages, editors, categories, machines, operating systems) for a date range. Give start and end (YYYY-MM-DD) or a range such as 'Last 7 Days'. project adds branches and entities.",
          input: object({
            user,
            start: optString(),
            end: optString(),
            range: optString(),
            project: optString(),
            branches: optString(),
            timeout: number().optional(),
            writes_only: boolean().optional(),
            timezone: optString(),
          }),
        },
        async (_ctx, { user, ...rest }) => c.get(`${p(user)}/summaries`, rest),
      ),
      statusBarToday: query(
        {
          description: "Today's coding summary, as shown in editor status bars (served from cache).",
          input: object({ user }),
        },
        async (_ctx, { user }) => c.get(`${p(user)}/status_bar/today`),
      ),
    }),
    stats: router({
      get: query(
        {
          description:
            "Coding stats for a range: YYYY, YYYY-MM, last_7_days, last_30_days, last_6_months, last_year or all_time. Omit range for the public profile range. A 202 means stats are still being computed; retry.",
          input: object({ user, range: optString(), timeout: number().optional(), writes_only: boolean().optional() }),
        },
        async (_ctx, { user, range, ...rest }) =>
          c.get(`${p(user)}/stats${range ? `/${c.segment(range)}` : ""}`, rest),
      ),
      allTimeSinceToday: query(
        {
          description: "Total coding time since the user's account was created, optionally for one project.",
          input: object({ user, project: optString() }),
        },
        async (_ctx, { user, project }) => c.get(`${p(user)}/all_time_since_today`, { project }),
      ),
      aggregated: query(
        {
          description: "Aggregated public stats across all WakaTime users for last_7_days or a past year (2013 onward).",
          input: object({ range: string({ minLength: 1 }) }),
        },
        async (_ctx, { range }) => c.get(`/stats/${c.segment(range)}`),
      ),
    }),
    insights: router({
      get: query(
        {
          description:
            "Insight for a range. insight_type: stats, weekdays, days, ai_days, best_day, daily_average, projects, languages, editors, categories, machines, operating_systems. range: YYYY, YYYY-MM, last_7_days, last_30_days, last_6_months, last_year, all_time.",
          input: object({
            user,
            insight_type: string({ minLength: 1 }),
            range: string({ minLength: 1 }),
            timeout: number().optional(),
            writes_only: boolean().optional(),
            weekday: optString(),
          }),
        },
        async (_ctx, { user, insight_type, range, ...rest }) =>
          c.get(`${p(user)}/insights/${c.segment(insight_type)}/${c.segment(range)}`, rest),
      ),
    }),
    durations: router({
      list: query(
        {
          description:
            "Coding durations (time blocks) for one day (YYYY-MM-DD). slice_by groups by entity, language, dependencies, os, editor, category or machine.",
          input: object({
            user,
            date: string({ minLength: 1 }),
            project: optString(),
            branches: optString(),
            timeout: number().optional(),
            writes_only: boolean().optional(),
            timezone: optString(),
            slice_by: optString(),
          }),
        },
        async (_ctx, { user, ...rest }) => c.get(`${p(user)}/durations`, rest),
      ),
    }),
    externalDurations: router({
      list: query(
        {
          description: "External durations (time tracked outside editors) for one day (YYYY-MM-DD).",
          input: object({
            user,
            date: string({ minLength: 1 }),
            project: optString(),
            branches: optString(),
            timezone: optString(),
          }),
        },
        async (_ctx, { user, ...rest }) => c.get(`${p(user)}/external_durations`, rest),
      ),
      createBulk: mutation(
        {
          description:
            "Create up to 1000 external durations. Each item needs external_id, entity, type, category, start_time and end_time (unix seconds); project, branch, language and meta are optional.",
          input: object({ user, durations: array(json()) }),
          approval: always(),
        },
        async (_ctx, { user, durations }) => c.post(`${p(user)}/external_durations.bulk`, durations),
      ),
      deleteBulk: mutation(
        {
          description: "Delete external durations by id for one day (YYYY-MM-DD).",
          input: object({ user, date: string({ minLength: 1 }), ids: array(string()) }),
          approval: always(),
        },
        async (_ctx, { user, date, ids }) => c.del(`${p(user)}/external_durations.bulk`, undefined, { date, ids }),
      ),
    }),
    heartbeats: router({
      list: query(
        {
          description: "Heartbeats (raw coding activity events) for one day (YYYY-MM-DD).",
          input: object({ user, date: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, date }) => c.get(`${p(user)}/heartbeats`, { date }),
      ),
      create: mutation(
        {
          description:
            "Send one heartbeat. Required: entity, type (file, app or domain), time (unix seconds). Optional: category, project, branch, language, dependencies, lines, lineno, cursorpos, is_write.",
          input: object({ user, heartbeat: json() }),
          approval: always(),
        },
        async (_ctx, { user, heartbeat }) => c.post(`${p(user)}/heartbeats`, heartbeat),
      ),
      createBulk: mutation(
        {
          description: "Send up to 25 heartbeats at once. Each has the same fields as a single heartbeat.",
          input: object({ user, heartbeats: array(json()) }),
          approval: always(),
        },
        async (_ctx, { user, heartbeats }) => c.post(`${p(user)}/heartbeats.bulk`, heartbeats),
      ),
      deleteBulk: mutation(
        {
          description: "Delete heartbeats by id for one day (YYYY-MM-DD).",
          input: object({ user, date: string({ minLength: 1 }), ids: array(string()) }),
          approval: always(),
        },
        async (_ctx, { user, date, ids }) => c.del(`${p(user)}/heartbeats.bulk`, undefined, { date, ids }),
      ),
    }),
    goals: router({
      list: query(
        { description: "Coding goals and their recent progress.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/goals`),
      ),
      get: query(
        {
          description: "One coding goal with its chart data.",
          input: object({ user, goal: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, goal }) => c.get(`${p(user)}/goals/${c.segment(goal)}`),
      ),
    }),
    projects: router({
      list: query(
        {
          description: "Projects the user has coded on. q filters by name.",
          input: object({ user, q: optString() }),
        },
        async (_ctx, { user, q }) => c.get(`${p(user)}/projects`, { q }),
      ),
      commits: query(
        {
          description: "Commits of a project with the coding time spent on each. Filter by author or branch; paginated.",
          input: object({
            user,
            project: string({ minLength: 1 }),
            author: optString(),
            branch: optString(),
            page: number().optional(),
          }),
        },
        async (_ctx, { user, project, ...rest }) =>
          c.get(`${p(user)}/projects/${c.segment(project)}/commits`, rest),
      ),
      commit: query(
        {
          description: "One commit of a project by hash, with its coding time.",
          input: object({ user, project: string({ minLength: 1 }), hash: string({ minLength: 1 }), branch: optString() }),
        },
        async (_ctx, { user, project, hash, branch }) =>
          c.get(`${p(user)}/projects/${c.segment(project)}/commits/${c.segment(hash)}`, { branch }),
      ),
    }),
    customRules: router({
      list: query(
        { description: "Custom rules that rewrite project, language and other heartbeat fields.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/custom_rules`),
      ),
      progress: query(
        {
          description: "Progress of a custom-rules reprocessing job.",
          input: object({ user, job_id: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, job_id }) => c.get(`${p(user)}/custom_rules_progress`, { job_id }),
      ),
      replace: mutation(
        {
          description:
            "Replace the user's custom rules with the given array. Each rule has action, source, operation, source_value, destination, destination_value and priority; include id to keep an existing rule.",
          input: object({ user, rules: array(json()) }),
          approval: always(),
        },
        async (_ctx, { user, rules }) => c.put(`${p(user)}/custom_rules`, rules),
      ),
      delete: mutation(
        {
          description: "Delete one custom rule.",
          input: object({ user, rule_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { user, rule_id }) => c.del(`${p(user)}/custom_rules/${c.segment(rule_id)}`),
      ),
      abortProgress: mutation(
        {
          description: "Abort the running custom-rules reprocessing job.",
          input: object({ user }),
          approval: always(),
        },
        async (_ctx, { user }) => c.del(`${p(user)}/custom_rules_progress`),
      ),
    }),
    dataDumps: router({
      list: query(
        { description: "Data export requests and their download links.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/data_dumps`),
      ),
      create: mutation(
        {
          description: "Request a data export. type is daily or heartbeats; the result is emailed when email_when_finished is true.",
          input: object({ user, type: string({ minLength: 1 }), email_when_finished: boolean().optional() }),
          approval: always(),
        },
        async (_ctx, { user, ...body }) => c.post(`${p(user)}/data_dumps`, body),
      ),
    }),
    machines: router({
      list: query(
        { description: "Machines the user has coded on.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/machine_names`),
      ),
    }),
    userAgents: router({
      list: query(
        { description: "Editors and plugins (user agents) the user has sent data from.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/user_agents`),
      ),
    }),
    orgs: router({
      list: query(
        { description: "Organizations the user belongs to.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/orgs`),
      ),
      customRules: query(
        {
          description: "Custom rules of an organization.",
          input: object({ user, org: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, org }) => c.get(`${p(user)}/orgs/${c.segment(org)}/custom_rules`),
      ),
      dashboards: query(
        {
          description: "Dashboards of an organization.",
          input: object({ user, org: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, org }) => c.get(`${p(user)}/orgs/${c.segment(org)}/dashboards`),
      ),
      members: query(
        {
          description: "Members of an organization dashboard.",
          input: object({ user, org: string({ minLength: 1 }), dashboard: string({ minLength: 1 }) }),
        },
        async (_ctx, { user, org, dashboard }) =>
          c.get(`${p(user)}/orgs/${c.segment(org)}/dashboards/${c.segment(dashboard)}/members`),
      ),
      dashboardDurations: query(
        {
          description: "Durations for a whole dashboard for one day (YYYY-MM-DD).",
          input: object({
            user,
            org: string({ minLength: 1 }),
            dashboard: string({ minLength: 1 }),
            date: string({ minLength: 1 }),
            project: optString(),
            branches: optString(),
            slice_by: optString(),
          }),
        },
        async (_ctx, { user, org, dashboard, ...rest }) =>
          c.get(`${p(user)}/orgs/${c.segment(org)}/dashboards/${c.segment(dashboard)}/durations`, rest),
      ),
      dashboardSummaries: query(
        {
          description: "Summaries for a whole dashboard for one day (YYYY-MM-DD).",
          input: object({
            user,
            org: string({ minLength: 1 }),
            dashboard: string({ minLength: 1 }),
            date: string({ minLength: 1 }),
            project: optString(),
            branches: optString(),
          }),
        },
        async (_ctx, { user, org, dashboard, ...rest }) =>
          c.get(`${p(user)}/orgs/${c.segment(org)}/dashboards/${c.segment(dashboard)}/summaries`, rest),
      ),
      memberDurations: query(
        {
          description: "Durations of one dashboard member for one day (YYYY-MM-DD).",
          input: object({
            user,
            org: string({ minLength: 1 }),
            dashboard: string({ minLength: 1 }),
            member: string({ minLength: 1 }),
            date: string({ minLength: 1 }),
            project: optString(),
            branches: optString(),
            slice_by: optString(),
          }),
        },
        async (_ctx, { user, org, dashboard, member, ...rest }) =>
          c.get(
            `${p(user)}/orgs/${c.segment(org)}/dashboards/${c.segment(dashboard)}/members/${c.segment(member)}/durations`,
            rest,
          ),
      ),
      memberSummaries: query(
        {
          description:
            "Summaries of one dashboard member. Give start and end (YYYY-MM-DD) or a range such as 'Last 7 Days'.",
          input: object({
            user,
            org: string({ minLength: 1 }),
            dashboard: string({ minLength: 1 }),
            member: string({ minLength: 1 }),
            start: optString(),
            end: optString(),
            range: optString(),
            project: optString(),
            branches: optString(),
          }),
        },
        async (_ctx, { user, org, dashboard, member, ...rest }) =>
          c.get(
            `${p(user)}/orgs/${c.segment(org)}/dashboards/${c.segment(dashboard)}/members/${c.segment(member)}/summaries`,
            rest,
          ),
      ),
    }),
    leaderboards: router({
      privateList: query(
        { description: "The user's private leaderboards.", input: object({ user }) },
        async (_ctx, { user }) => c.get(`${p(user)}/leaderboards`),
      ),
      privateLeaders: query(
        {
          description:
            "Leaders of a private leaderboard. board_type is time (default), manual, ai or spend; filter by language or two-letter country_code.",
          input: object({
            user,
            board: string({ minLength: 1 }),
            language: optString(),
            country_code: optString(),
            board_type: optString(),
            page: number().optional(),
          }),
        },
        async (_ctx, { user, board, ...rest }) => c.get(`${p(user)}/leaderboards/${c.segment(board)}`, rest),
      ),
      publicLeaders: query(
        {
          description: "The public WakaTime leaderboard. Filter by language, country_code, is_hireable or board_type.",
          input: object({
            language: optString(),
            is_hireable: boolean().optional(),
            country_code: optString(),
            board_type: optString(),
            page: number().optional(),
          }),
        },
        async (_ctx, input) => c.get("/leaders", input),
      ),
    }),
    reference: router({
      editors: query(
        {
          description: "Editors WakaTime has plugins for.",
          input: object({ unreleased: boolean().optional() }),
        },
        async (_ctx, input) => c.get("/editors", input),
      ),
      programLanguages: query(
        { description: "Programming languages WakaTime recognizes, with colors.", input: object({}) },
        async () => c.get("/program_languages"),
      ),
      meta: query(
        { description: "WakaTime server metadata, including server IP addresses.", input: object({}) },
        async () => c.get("/meta"),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { wakatime: wakatime.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.wakatime ?? [], (account) => tools(client(account, fetch, signal)), { signal }),
      {
        title: "WakaTime",
        description:
          "Coding time summaries, stats, insights, durations, heartbeats, goals, projects, organizations and leaderboards from WakaTime.",
        icons,
      },
    ),
  }),
);
