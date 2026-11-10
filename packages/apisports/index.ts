import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

// Each sport is its own API-Sports host. The key goes in the x-apisports-key header.
const hosts = {
  football: "v3.football.api-sports.io",
  basketball: "v1.basketball.api-sports.io",
  nba: "v2.nba.api-sports.io",
  baseball: "v1.baseball.api-sports.io",
  afl: "v1.afl.api-sports.io",
  nfl: "v1.american-football.api-sports.io",
  formula1: "v1.formula-1.api-sports.io",
  mma: "v1.mma.api-sports.io",
} as const;

type Sport = keyof typeof hosts;

const apiSports = defineProvider({
  name: "API-Sports",
  hosts: Object.values(hosts),
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // /status is free of quota and reports the account behind the key.
    const response = await fetch(`https://${hosts.football}/status`, {
      signal,
      headers: { "x-apisports-key": account.fields.token },
    });
    assertNoErrors(await decodeJson(response, json()));
  },
});

type Fetch = typeof fetch;

// API-Sports answers HTTP 200 with a non-empty `errors` object or array for a bad key,
// a sport outside the plan, or invalid parameters.
function assertNoErrors(body: unknown): void {
  const errors = (body as { errors?: unknown } | null)?.errors;
  if (errors == null) return;
  const empty = Array.isArray(errors)
    ? errors.length === 0
    : typeof errors === "object"
      ? Object.keys(errors as object).length === 0
      : false;
  if (empty) return;
  const text = Array.isArray(errors)
    ? errors.map((e) => (typeof e === "string" ? e : JSON.stringify(e))).join(", ")
    : typeof errors === "object"
      ? Object.entries(errors as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join(", ")
      : String(errors);
  throw new Error(`API-Sports error: ${text}`);
}
const Params = record(json()).optional();

function client(sport: Sport, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Record<string, unknown> | undefined) => {
    const url = new URL(`https://${hosts[sport]}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null) continue;
      // Multi-id filters take ids=1-2-3 rather than repeated keys.
      url.searchParams.set(key, Array.isArray(value) ? value.join("-") : String(value));
    }
    const response = await fetcher(url.toString(), { headers: { "x-apisports-key": token }, signal });
    const body = await decodeJson(response, json());
    assertNoErrors(body);
    return body;
  };
}

const paramsHelp =
  "params holds the endpoint's query filters (for example { league: 39, season: 2024 }); arrays are joined with '-'.";

// One read tool per endpoint: key is the tool name, value is [path, description].
function endpoints(call: ReturnType<typeof client>, table: Record<string, readonly [string, string]>) {
  return router(
    Object.fromEntries(
      Object.entries(table).map(([name, [path, description]]) => [
        name,
        query({ description: `${description} ${paramsHelp}`, input: object({ params: Params }) }, (_c, { params }) =>
          call(path, params),
        ),
      ]),
    ),
  );
}

function sportRouters(sport: Sport, call: ReturnType<typeof client>) {
  switch (sport) {
    case "football":
      return endpoints(call, {
        status: ["/status", "Account status: subscription, requests used today and daily limit."],
        timezone: ["/timezone", "List supported timezones."],
        countries: ["/countries", "List countries."],
        leagues: ["/leagues", "List leagues and cups with their seasons and coverage."],
        leagueSeasons: ["/leagues/seasons", "List all available league seasons."],
        teams: ["/teams", "List teams, filter by id, name, league, season, country or venue."],
        teamSeasons: ["/teams/seasons", "Seasons available for a team."],
        teamCountries: ["/teams/countries", "Countries available for teams."],
        teamStatistics: ["/teams/statistics", "Team statistics for a league, season and team."],
        venues: ["/venues", "List venues (stadiums)."],
        standings: ["/standings", "League standings for a league and season."],
        fixtures: ["/fixtures", "List fixtures by id, date, league, season, team, round, status or live."],
        fixtureRounds: ["/fixtures/rounds", "Rounds of a league season."],
        headToHead: ["/fixtures/headtohead", "Head-to-head fixtures between two teams (h2h=teamA-teamB)."],
        fixtureStatistics: ["/fixtures/statistics", "Team statistics for a fixture."],
        fixtureEvents: ["/fixtures/events", "Goals, cards and substitutions of a fixture."],
        fixtureLineups: ["/fixtures/lineups", "Lineups of a fixture."],
        fixturePlayers: ["/fixtures/players", "Player statistics for a fixture."],
        injuries: ["/injuries", "Player injuries by league, season, fixture, team or player."],
        predictions: ["/predictions", "Predictions for a fixture."],
        players: ["/players", "Player statistics by id, team, league and season."],
        playerProfiles: ["/players/profiles", "Player profiles, search by name or page through all."],
        playerSeasons: ["/players/seasons", "Seasons available for a player."],
        squads: ["/players/squads", "Current squad of a team or the teams of a player."],
        topScorers: ["/players/topscorers", "Top scorers of a league season."],
        topAssists: ["/players/topassists", "Top assist providers of a league season."],
        topYellowCards: ["/players/topyellowcards", "Players with most yellow cards in a league season."],
        topRedCards: ["/players/topredcards", "Players with most red cards in a league season."],
        coaches: ["/coachs", "Coaches by id, team or name."],
        transfers: ["/transfers", "Transfers of a player or team."],
        trophies: ["/trophies", "Trophies of a player or coach."],
        sidelined: ["/sidelined", "Sidelined history of a player or coach."],
        odds: ["/odds", "Pre-match odds."],
        liveOdds: ["/odds/live", "In-play odds."],
        oddsBookmakers: ["/odds/bookmakers", "List bookmakers."],
        oddsBets: ["/odds/bets", "List pre-match bet types."],
        oddsMapping: ["/odds/mapping", "Fixtures that have pre-match odds."],
      });
    case "basketball":
      return endpoints(call, {
        statistics: ["/statistics", "Basketball statistics."],
        bets: ["/bets", "List bet types."],
        bookmakers: ["/bookmakers", "List bookmakers."],
        gameTeamStatistics: ["/games/statistics/teams", "Team statistics of a game."],
      });
    case "baseball":
      return endpoints(call, {
        headToHead: ["/games/h2h", "Head-to-head games between two teams (h2h=teamA-teamB)."],
      });
    case "afl":
      return endpoints(call, {
        seasons: ["/seasons", "List available seasons."],
        games: ["/games", "List games."],
        gameQuarters: ["/games/quarters", "Quarter-by-quarter scores of a game."],
        gamePlayerStatistics: ["/games/statistics/players", "Player statistics of a game."],
        standings: ["/standings", "Standings for a league and season."],
      });
    case "nba":
      return endpoints(call, {
        gameStatistics: ["/games/statistics", "Statistics for a game."],
        playerStatistics: ["/players/statistics", "Player statistics by game, team or player and season."],
      });
    case "nfl":
      return endpoints(call, {
        gameEvents: ["/games/events", "Events of a game."],
        divisions: ["/standings/divisions", "Standing divisions."],
        conferences: ["/standings/conferences", "Standing conferences."],
      });
    case "formula1":
      return endpoints(call, {
        competitions: ["/competitions", "List competitions (grands prix)."],
        circuits: ["/circuits", "List circuits."],
        races: ["/races", "Races by id, date, season, competition or type."],
        driverRankings: ["/rankings/drivers", "Driver rankings for a season."],
        teamRankings: ["/rankings/teams", "Team rankings for a season."],
        raceRankings: ["/rankings/races", "Race result rankings."],
        fastestLaps: ["/rankings/fastestlaps", "Fastest laps of a race."],
        startingGrid: ["/rankings/startinggrid", "Starting grid of a race."],
      });
    case "mma":
      return endpoints(call, {
        categories: ["/categories", "List weight categories."],
        fighters: ["/fighters", "Fighters by id, name, team or category."],
        fighterRecords: ["/fighters/records", "Fighter records."],
        fights: ["/fights", "Fights by id, date, season, category or fighter."],
        fightResults: ["/fights/results", "Results of a fight."],
        fightStatistics: ["/fights/statistics/fighters", "Fighter statistics of a fight."],
      });
  }
}

const titles: Record<Sport, string> = {
  football: "Football",
  basketball: "Basketball",
  nba: "NBA",
  baseball: "Baseball",
  afl: "AFL",
  nfl: "NFL (American football)",
  formula1: "Formula 1",
  mma: "MMA",
};

export default defineApp(
  { user: { accounts: { apisports: apiSports.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apisports ?? [],
        (account) =>
          router(
            Object.fromEntries(
              (Object.keys(hosts) as Sport[]).map((sport) => [
                sport,
                router(sportRouters(sport, client(sport, account.fields.token, fetch, signal)), {
                  title: titles[sport],
                  description: `${titles[sport]} data from ${hosts[sport]}. Every API-Sports sport needs a plan that includes it.`,
                }),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "API-Sports",
        description:
          "Live scores, fixtures, standings, players, statistics and odds across football, basketball, NBA, baseball, AFL, NFL, Formula 1 and MMA.",
        icons,
      },
    ),
  }),
);
