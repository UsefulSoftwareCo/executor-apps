import {
  accountRouter,
  array,
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
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://fantasysports.yahooapis.com/fantasy/v2";

const yahoo = defineProvider({
  name: "Yahoo",
  hosts: ["fantasysports.yahooapis.com", "api.login.yahoo.com"],
  auth: {
    // Yahoo has no API keys and no client registration: the connect page asks for the client
    // of an app created at https://developer.yahoo.com/apps/ with Fantasy Sports permission.
    oauth: oauth2({
      authorizationUrl: "https://api.login.yahoo.com/oauth2/request_auth",
      tokenUrl: "https://api.login.yahoo.com/oauth2/get_token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["fspt-w"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users;use_login=1?format=json`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const body = await decodeJson(response, json());
    // Yahoo nests the user as fantasy_content.users[0].user[0].guid.
    const guid = (body as any)?.fantasy_content?.users?.["0"]?.user?.[0]?.guid;
    if (typeof guid !== "string") throw new Error("Yahoo did not return a user guid.");
    return { accountInfo: { externalId: guid } };
  },
});

type Account = { fields: { access_token: string } };
type Params = Record<string, string | number | undefined>;

const optString = () => string().optional();

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function client(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const seg = encodeURIComponent;
  // Yahoo path parameters look like `players;start=0;count=25` and sub-resources like `/stats;type=week`.
  const matrix = (path: string, params: Params = {}) =>
    path +
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([name, value]) => `;${name}=${encodeURIComponent(String(value))}`)
      .join("");
  const send = async (method: string, path: string, xml?: string) =>
    decodeJson(
      await fetcher(`${base}${path}${path.includes("?") ? "&" : "?"}format=json`, {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${account.fields.access_token}`,
          ...(xml === undefined ? {} : { "content-type": "application/xml" }),
        },
        ...(xml === undefined ? {} : { body: xml }),
      }),
      json(),
    );
  return {
    seg,
    matrix,
    get: (path: string) => send("GET", path),
    post: (path: string, xml: string) => send("POST", path, xml),
    put: (path: string, xml: string) => send("PUT", path, xml),
    del: (path: string) => send("DELETE", path),
  };
}

type Client = ReturnType<typeof client>;

const gameKey = string({ minLength: 1 });
const leagueKey = string({ minLength: 1 });
const teamKey = string({ minLength: 1 });
const playerKey = string({ minLength: 1 });

const gameKeyHelp = "game_key is a game code (nfl, nba, mlb, nhl) or a numeric game id";
const leagueKeyHelp = "league_key looks like 423.l.12345 (game id, '.l.', league id)";
const teamKeyHelp = "team_key looks like 423.l.12345.t.1";
const playerKeyHelp = "player_key looks like 423.p.8888";

const pagination = { start: number().optional(), count: number().optional() };

function tools(c: Client) {
  const leaguePath = (league_key: string) => `/league/${c.seg(league_key)}`;
  const teamPath = (team_key: string) => `/team/${c.seg(team_key)}`;
  const games = c.matrix("/users;use_login=1/games");

  return router({
    user: router({
      games: query(
        {
          description:
            "Fantasy games (sport and season) the signed-in Yahoo user has played in. Returns game keys for use in other tools.",
          input: object({}),
        },
        async () => c.get(games),
      ),
      leagues: query(
        {
          description: `Leagues the signed-in user belongs to in the given games. game_keys is comma separated; ${gameKeyHelp}.`,
          input: object({ game_keys: string({ minLength: 1 }) }),
        },
        async (_ctx, { game_keys }) =>
          c.get(`/users;use_login=1/games;game_keys=${c.seg(game_keys)}/leagues`),
      ),
      teams: query(
        {
          description: `Teams the signed-in user manages in the given games. game_keys is comma separated; ${gameKeyHelp}.`,
          input: object({ game_keys: string({ minLength: 1 }) }),
        },
        async (_ctx, { game_keys }) => c.get(`/users;use_login=1/games;game_keys=${c.seg(game_keys)}/teams`),
      ),
    }),
    games: router({
      get: query(
        {
          description: `Metadata for a game (season, status, scoring weeks). ${gameKeyHelp}.`,
          input: object({ game_key: gameKey }),
        },
        async (_ctx, { game_key }) => c.get(`/game/${c.seg(game_key)}`),
      ),
      leagues: query(
        {
          description: `Metadata for specific leagues of a game. league_keys is comma separated; ${leagueKeyHelp}.`,
          input: object({ league_keys: string({ minLength: 1 }) }),
        },
        async (_ctx, { league_keys }) => c.get(`/leagues;league_keys=${c.seg(league_keys)}`),
      ),
      players: query(
        {
          description: `Players in a game. Filter by position, status (A, FA, W, T, K), search by name, sort and paginate. ${gameKeyHelp}.`,
          input: object({
            game_key: gameKey,
            position: optString(),
            status: optString(),
            search: optString(),
            sort: optString(),
            ...pagination,
          }),
        },
        async (_ctx, { game_key, ...filters }) => c.get(`/game/${c.seg(game_key)}/${c.matrix("players", filters)}`),
      ),
      positionTypes: query(
        {
          description: `Position types (offense, defense, ...) of a game. ${gameKeyHelp}.`,
          input: object({ game_key: gameKey }),
        },
        async (_ctx, { game_key }) => c.get(`/game/${c.seg(game_key)}/position_types`),
      ),
      statCategories: query(
        {
          description: `Stat categories of a game. ${gameKeyHelp}.`,
          input: object({ game_key: gameKey }),
        },
        async (_ctx, { game_key }) => c.get(`/game/${c.seg(game_key)}/stat_categories`),
      ),
      gameWeeks: query(
        {
          description: `Weeks of a game's season with start and end dates. ${gameKeyHelp}.`,
          input: object({ game_key: gameKey }),
        },
        async (_ctx, { game_key }) => c.get(`/game/${c.seg(game_key)}/game_weeks`),
      ),
    }),
    leagues: router({
      get: query(
        {
          description: `League metadata: name, scoring type, current week, number of teams. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey }),
        },
        async (_ctx, { league_key }) => c.get(`${leaguePath(league_key)}/metadata`),
      ),
      settings: query(
        {
          description: `League settings: roster positions, stat categories and modifiers, trade and waiver rules, playoffs. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey }),
        },
        async (_ctx, { league_key }) => c.get(`${leaguePath(league_key)}/settings`),
      ),
      standings: query(
        {
          description: `League standings with wins, losses, points and rank. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey }),
        },
        async (_ctx, { league_key }) => c.get(`${leaguePath(league_key)}/standings`),
      ),
      scoreboard: query(
        {
          description: `Matchups and scores for a league. Give week for head-to-head leagues. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey, week: optString() }),
        },
        async (_ctx, { league_key, week }) => c.get(`${leaguePath(league_key)}/${c.matrix("scoreboard", { week })}`),
      ),
      teams: query(
        {
          description: `Teams in a league with managers and logos. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey }),
        },
        async (_ctx, { league_key }) => c.get(`${leaguePath(league_key)}/teams`),
      ),
      players: query(
        {
          description: `Players in a league with ownership status. status: A (all available), FA (free agents), W (waivers), T (taken), K (keepers). position filters by slot such as QB or C. search matches names; sort is a stat id, AR, OR, or NAME. ${leagueKeyHelp}.`,
          input: object({
            league_key: leagueKey,
            status: optString(),
            position: optString(),
            search: optString(),
            sort: optString(),
            sort_type: optString(),
            sort_season: optString(),
            sort_week: optString(),
            ...pagination,
          }),
        },
        async (_ctx, { league_key, ...filters }) => c.get(`${leaguePath(league_key)}/${c.matrix("players", filters)}`),
      ),
      draftResults: query(
        {
          description: `Draft picks made so far in a league. ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey }),
        },
        async (_ctx, { league_key }) => c.get(`${leaguePath(league_key)}/draftresults`),
      ),
      transactions: query(
        {
          description: `Recent transactions (adds, drops, trades, commissioner moves). types is comma separated: add, drop, commish, trade. Pass team_key to restrict to one team (required for waiver and pending_trade types). ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey, types: optString(), team_key: optString(), count: number().optional() }),
        },
        async (_ctx, { league_key, ...filters }) =>
          c.get(`${leaguePath(league_key)}/${c.matrix("transactions", filters)}`),
      ),
    }),
    teams: router({
      get: query(
        {
          description: `Team metadata: name, manager, waiver priority, FAAB balance, number of moves and trades. ${teamKeyHelp}.`,
          input: object({ team_key: teamKey }),
        },
        async (_ctx, { team_key }) => c.get(`${teamPath(team_key)}/metadata`),
      ),
      roster: query(
        {
          description: `Team roster with each player's slot. Give date (YYYY-MM-DD, daily leagues) or week (weekly leagues). ${teamKeyHelp}.`,
          input: object({ team_key: teamKey, date: optString(), week: optString() }),
        },
        async (_ctx, { team_key, ...coverage }) => c.get(`${teamPath(team_key)}/${c.matrix("roster/players", coverage)}`),
      ),
      stats: query(
        {
          description: `Team stats. type is season, week or date (default season); add week or date to match. ${teamKeyHelp}.`,
          input: object({ team_key: teamKey, type: optString(), week: optString(), date: optString() }),
        },
        async (_ctx, { team_key, ...coverage }) => c.get(`${teamPath(team_key)}/${c.matrix("stats", coverage)}`),
      ),
      standings: query(
        {
          description: `Standings record of one team. ${teamKeyHelp}.`,
          input: object({ team_key: teamKey }),
        },
        async (_ctx, { team_key }) => c.get(`${teamPath(team_key)}/standings`),
      ),
      matchups: query(
        {
          description: `Matchups of a team for the given weeks (comma separated; all weeks when omitted). ${teamKeyHelp}.`,
          input: object({ team_key: teamKey, weeks: optString() }),
        },
        async (_ctx, { team_key, weeks }) => c.get(`${teamPath(team_key)}/${c.matrix("matchups", { weeks })}`),
      ),
      draftResults: query(
        {
          description: `Picks a team made in its draft. ${teamKeyHelp}.`,
          input: object({ team_key: teamKey }),
        },
        async (_ctx, { team_key }) => c.get(`${teamPath(team_key)}/draftresults`),
      ),
      transactions: query(
        {
          description: `Transactions involving a team. ${teamKeyHelp}.`,
          input: object({ team_key: teamKey }),
        },
        async (_ctx, { team_key }) => c.get(`${teamPath(team_key)}/transactions`),
      ),
      editRoster: mutation(
        {
          description: `Move players between roster slots. Give either date (YYYY-MM-DD, daily leagues) or week (weekly leagues), and players as [{ player_key, position }] where position is a slot such as QB, C, BN or IL. ${teamKeyHelp}.`,
          input: object({
            team_key: teamKey,
            date: optString(),
            week: optString(),
            players: array(object({ player_key: playerKey, position: string({ minLength: 1 }) })),
          }),
          approval: always(),
        },
        async (_ctx, { team_key, date, week, players }) => {
          const coverage =
            date !== undefined
              ? `<coverage_type>date</coverage_type><date>${escapeXml(date)}</date>`
              : week !== undefined
                ? `<coverage_type>week</coverage_type><week>${escapeXml(week)}</week>`
                : undefined;
          if (coverage === undefined) throw new Error("Give date or week.");
          const body = players
            .map(
              (p) =>
                `<player><player_key>${escapeXml(p.player_key)}</player_key><position>${escapeXml(p.position)}</position></player>`,
            )
            .join("");
          return c.put(
            `${teamPath(team_key)}/roster`,
            `<fantasy_content><roster>${coverage}<players>${body}</players></roster></fantasy_content>`,
          );
        },
      ),
    }),
    players: router({
      get: query(
        {
          description: `Player metadata: name, team, eligible positions, status, injury note. ${playerKeyHelp}.`,
          input: object({ player_key: playerKey }),
        },
        async (_ctx, { player_key }) => c.get(`/player/${c.seg(player_key)}/metadata`),
      ),
      stats: query(
        {
          description: `Player stats. type is season, week, date, lastweek, lastmonth or average_season (default season); add season, week or date to match. ${playerKeyHelp}.`,
          input: object({ player_key: playerKey, type: optString(), season: optString(), week: optString(), date: optString() }),
        },
        async (_ctx, { player_key, ...coverage }) => c.get(`/player/${c.seg(player_key)}/${c.matrix("stats", coverage)}`),
      ),
      ownership: query(
        {
          description: `Who owns a player in a league and how widely the player is rostered across Yahoo. ${playerKeyHelp}; ${leagueKeyHelp}.`,
          input: object({ league_key: leagueKey, player_key: playerKey }),
        },
        async (_ctx, { league_key, player_key }) =>
          c.get(`${leaguePath(league_key)}/players;player_keys=${c.seg(player_key)}/ownership`),
      ),
      percentOwned: query(
        {
          description: `Percent of Yahoo leagues in which a player is rostered. ${playerKeyHelp}.`,
          input: object({ player_key: playerKey }),
        },
        async (_ctx, { player_key }) => c.get(`/player/${c.seg(player_key)}/percent_owned`),
      ),
      draftAnalysis: query(
        {
          description: `Average draft position, average round and percent drafted for a player. ${playerKeyHelp}.`,
          input: object({ player_key: playerKey }),
        },
        async (_ctx, { player_key }) => c.get(`/player/${c.seg(player_key)}/draft_analysis`),
      ),
    }),
    transactions: router({
      get: query(
        {
          description: "One transaction by key (for example 423.l.12345.tr.7), with its players and teams.",
          input: object({ transaction_key: string({ minLength: 1 }) }),
        },
        async (_ctx, { transaction_key }) => c.get(`/transaction/${c.seg(transaction_key)}`),
      ),
      add: mutation(
        {
          description: `Add a free agent to a team, optionally dropping one of its players in the same move. Waiver-period players become waiver claims; faab_bid places a FAAB bid. ${teamKeyHelp}; ${playerKeyHelp}.`,
          input: object({
            league_key: leagueKey,
            team_key: teamKey,
            add_player_key: playerKey,
            drop_player_key: optString(),
            faab_bid: number().optional(),
          }),
          approval: always(),
        },
        async (_ctx, { league_key, team_key, add_player_key, drop_player_key, faab_bid }) => {
          const add = `<player><player_key>${escapeXml(add_player_key)}</player_key><transaction_data><type>add</type><destination_team_key>${escapeXml(team_key)}</destination_team_key></transaction_data></player>`;
          const drop =
            drop_player_key === undefined
              ? ""
              : `<player><player_key>${escapeXml(drop_player_key)}</player_key><transaction_data><type>drop</type><source_team_key>${escapeXml(team_key)}</source_team_key></transaction_data></player>`;
          const type = drop_player_key === undefined ? "add" : "add/drop";
          const bid = faab_bid === undefined ? "" : `<faab_bid>${faab_bid}</faab_bid>`;
          return c.post(
            `${leaguePath(league_key)}/transactions`,
            `<fantasy_content><transaction><type>${type}</type>${bid}<players>${add}${drop}</players></transaction></fantasy_content>`,
          );
        },
      ),
      drop: mutation(
        {
          description: `Drop a player from a team. ${teamKeyHelp}; ${playerKeyHelp}.`,
          input: object({ league_key: leagueKey, team_key: teamKey, player_key: playerKey }),
          approval: always(),
        },
        async (_ctx, { league_key, team_key, player_key }) =>
          c.post(
            `${leaguePath(league_key)}/transactions`,
            `<fantasy_content><transaction><type>drop</type><player><player_key>${escapeXml(player_key)}</player_key><transaction_data><type>drop</type><source_team_key>${escapeXml(team_key)}</source_team_key></transaction_data></player></transaction></fantasy_content>`,
          ),
      ),
      cancel: mutation(
        {
          description: "Cancel a pending waiver claim or trade proposal you made, by transaction key.",
          input: object({ transaction_key: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { transaction_key }) => c.del(`/transaction/${c.seg(transaction_key)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { yahoo: yahoo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.yahoo ?? [], (account) => tools(client(account, fetch, signal)), { signal }),
      {
        title: "Yahoo Fantasy Sports",
        description:
          "Yahoo Fantasy Sports leagues, teams, rosters, players, standings, scoreboards, drafts and transactions.",
        icons,
      },
    ),
  }),
);
