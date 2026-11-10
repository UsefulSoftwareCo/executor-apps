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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.pointagram.com/server/externalapi.php";

const pointagram = defineProvider({
  name: "Pointagram",
  hosts: ["app.pointagram.com"],
  auth: {
    // Pointagram has no OAuth: a Custom Integration key is paired with the login email of its owner.
    apiKey: secrets({
      label: "Custom Integration key",
      fields: object({ apiKey: string({ minLength: 1 }), email: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/test`, {
      method: "POST",
      signal,
      headers: { api_key: account.fields.apiKey, api_user: account.fields.email, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Pointagram rejected the credentials (HTTP ${response.status})`);
    return { accountInfo: { externalId: account.fields.email, displayName: account.fields.email } };
  },
});

type Credentials = { apiKey: string; email: string };
type Call = (method: string, action: string, params: Record<string, unknown>) => Promise<unknown>;

function client(credentials: Credentials, fetcher: typeof fetch, signal: AbortSignal | undefined): Call {
  return async (method, action, params) => {
    const url = new URL(`${base}/${action}`);
    const withBody = method !== "GET";
    if (!withBody) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { api_key: credentials.apiKey, api_user: credentials.email, "Content-Type": "application/json" },
      ...(withBody ? { body: JSON.stringify(params) } : {}),
    });
    return decodeJson(response, json());
  };
}

const text = (_note: string) => string().optional();
const player = {
  player_id: text("Pointagram player id"),
  player_name: text("Player name"),
  player_email: text("Player email"),
  player_external_id: text("Your own unique id for the player"),
};

function build(call: Call) {
  return router({
    connection: router({
      test: mutation({ description: "Verify the integration credentials.", input: object({}) }, () => call("POST", "test", {})),
    }),
    players: router({
      list: query(
        {
          description: "List players matching a search. Returns id, Name, emailaddress and external_id.",
          input: object({
            search_by: string(),
            filter: string(),
          }),
        },
        (_c, a) => call("GET", "list_players", a),
      ),
      create: mutation(
        {
          description: "Create a player. Fails with a conflict if the player exists. offline=1 makes an offline player, 0 sends an invitation.",
          input: object({
            player_name: string(),
            player_email: text("Email used for the invitation"),
            player_external_id: text("Your own unique id for the player"),
            offline: text('"1" for an offline player, "0" for an online player who gets an invite'),
          }),
        },
        (_c, a) => call("POST", "create_player", a),
      ),
      remove: mutation(
        {
          description: "Soft-delete a player identified by name, email and/or external id. Admins are ignored.",
          input: object({
            player_name: text("Player name"),
            player_email: text("Player email"),
            player_external_id: text("Your own unique id for the player"),
          }),
        },
        (_c, a) => call("POST", "remove_player", a),
      ),
    }),
    teams: router({
      list: query({ description: "List teams (id, name, icon).", input: object({}) }, () => call("GET", "list_teams", {})),
      create: mutation(
        {
          description: "Create a team. icon is mandatory: Bears.png, Bulls.png, Cobras.png, Lions.png, Raccons.png, Sharks.png or Tigers.png, or an icon uploaded in the UI.",
          input: object({ team_name: string(), icon: string(), filter_ignore: text('"1" exempts the team from filter settings') }),
        },
        (_c, a) => call("POST", "add_team", a),
      ),
      addPlayer: mutation(
        {
          description: "Add a player (player_id, player_external_id or player_email) to a team.",
          input: object({ ...player, teamid: string() }),
        },
        (_c, a) => call("POST", "add_to_team", a),
      ),
      removePlayer: mutation(
        {
          description: "Remove a player (player_id, player_external_id or player_email) from a team.",
          input: object({ ...player, teamid: string() }),
        },
        (_c, a) => call("DELETE", "remove_from_team", a),
      ),
    }),
    scoring: router({
      addScore: mutation(
        {
          description:
            "Add points. Identify the player by one of player_id/name/email/external_id and the series by scoreseries_name or scoreseries_id; give points or pointtype_name. Reusing source_score_id replaces the earlier transaction. tags is a JSON array like [{\"name\":\"North\"}]. Set create_player to 1 to create missing players.",
          input: object({
            ...player,
            scoreseries_name: text("Score series name"),
            scoreseries_id: text("Score series id"),
            points: number().optional(),
            pointtype_name: text("Point type name, used instead of points"),
            source_score_id: text("Transaction id for idempotent resubmission"),
            comment: text("Comment shown in the news feed"),
            score_time: text("Date and time of the transaction"),
            tags: json().optional(),
            create_player: number().optional(),
          }),
        },
        (_c, a) => call("POST", "add_score", a),
      ),
    }),
    scoreSeries: router({
      list: query({ description: "List score series.", input: object({}) }, () => call("GET", "list_score_series", {})),
      listPointTypes: query(
        { description: "List the point types of a score series.", input: object({ Scoreseries: string() }) },
        (_c, a) => call("GET", "list_score_series_point_types", a),
      ),
      history: query(
        {
          description:
            "Score transaction history for a series, newest first. Page by passing offset_timestamp and offset_id from the last row. Filters are JSON arrays; times are UTC like 2022-12-05 23:00:00.",
          input: object({
            scoreseriesid: string(),
            tags_filter: json().optional(),
            tags_or_filter: json().optional(),
            teams_filter: json().optional(),
            player_filter: json().optional(),
            time_from: text("UTC start time"),
            time_to: text("UTC end time"),
            show_revoked: text('"0" or "1"'),
            limit: number().optional(),
            offset_timestamp: text("Timestamp of the last row fetched"),
            offset_id: text("Id of the last row fetched"),
          }),
        },
        (_c, a) => call("GET", "list_score_series_history", a),
      ),
    }),
    competitions: router({
      list: query(
        {
          description: "List competitions, optionally limited to one player's, or one competition.",
          input: object({
            search_by: text("Field to search: Email, Name or External Id"),
            filter: text("Player search value"),
            competition_id: text("Competition id"),
            accesskey: text("Competition access key"),
          }),
        },
        (_c, a) => call("GET", "list_competitions", a),
      ),
      listPlayers: query({ description: "List competition players.", input: object({}) }, () => call("GET", "list_competition_players", {})),
    }),
  });
}

export default defineApp(
  { user: { accounts: { pointagram: pointagram.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pointagram ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Pointagram",
        description: "Gamification in Pointagram: players, teams, score series, scoring and competitions.",
        icons,
      },
    ),
  }),
);
