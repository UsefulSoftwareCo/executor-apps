import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const oauthHost = "https://oauth.battle.net";
const regions = ["us", "eu", "kr", "tw"] as const;

type Account =
  | { method: "apiKey"; fields: { clientId: string; clientSecret: string } }
  | { method: "oauth"; fields: { access_token: string } };

const Token = object({ access_token: string() });
const UserInfo = object({ id: number(), battletag: string() });

const battlenet = defineProvider({
  name: "Battle.net",
  hosts: [
    "oauth.battle.net",
    "us.api.blizzard.com",
    "eu.api.blizzard.com",
    "kr.api.blizzard.com",
    "tw.api.blizzard.com",
  ],
  auth: {
    // Client credentials from https://develop.battle.net/access/clients: public game data and public profiles.
    apiKey: secrets({
      label: "Client ID and client secret",
      fields: object({ clientId: string({ minLength: 1 }), clientSecret: string({ minLength: 1 }) }),
    }),
    // Adds the signed-in player's own account profile (wow.profile, sc2.profile, d3.profile).
    oauth: oauth2({
      discover: oauthHost,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["openid", "wow.profile", "sc2.profile", "d3.profile"],
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch(`${oauthHost}/userinfo`, {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
      const me = await decodeJson(response, UserInfo);
      return { accountInfo: { externalId: String(me.id), username: me.battletag } };
    }
    const response = await fetch(`${oauthHost}/token`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.clientId}:${account.fields.clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    await decodeJson(response, Token);
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: { token: string; expires: number } | undefined;
  const bearer = async () => {
    if (account.method === "oauth") return account.fields.access_token;
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(`${oauthHost}/token`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.clientId}:${account.fields.clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const token = await decodeJson(response, Token);
    cached = { token: token.access_token, expires: Date.now() + 10 * 60 * 1000 };
    return token.access_token;
  };
  return async (region: string, path: string, params: Params = {}) => {
    const url = new URL(`https://${region}.api.blizzard.com${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      signal,
      headers: { Authorization: `Bearer ${await bearer()}` },
    });
    if (!response.ok) {
      throw new Error(`Battle.net responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    return JSON.parse(await response.text()) as Record<string, unknown>;
  };
}

const enc = encodeURIComponent;
const regionNote = "region is us, eu, kr or tw (default us).";
const region = string().optional();
const locale = string().optional();
const slug = (s: string) => enc(s.toLowerCase());
const regionOf = (r: string | undefined) => {
  const value = r ?? "us";
  if (!(regions as readonly string[]).includes(value)) throw new Error(`region must be one of ${regions.join(", ")}`);
  return value;
};

const Base = object({ region, locale });
const Character = object({ region, locale, realmSlug: string({ minLength: 1 }), characterName: string({ minLength: 1 }) });
const Id = object({ region, locale, id: number() });
const Search = object({ region, locale, params: json() });

function build(send: ReturnType<typeof client>) {
  const wow = (r: string | undefined, kind: "static" | "dynamic" | "profile") => `${kind}-${regionOf(r)}`;

  const data = (path: string, description: string) =>
    query({ description: `${description} ${regionNote}`, input: Base }, async (_c, i) =>
      send(regionOf(i.region), path, { namespace: wow(i.region, "static"), locale: i.locale }),
    );
  const dataId = (path: (id: number) => string, description: string, kind: "static" | "dynamic" = "static") =>
    query({ description: `${description} ${regionNote}`, input: Id }, async (_c, i) =>
      send(regionOf(i.region), path(i.id), { namespace: wow(i.region, kind), locale: i.locale }),
    );
  const character = (suffix: string, description: string) =>
    query(
      {
        description: `${description} Realm is the realm slug (for example area-52); the character name is lowercased automatically. ${regionNote}`,
        input: Character,
      },
      async (_c, i) =>
        send(
          regionOf(i.region),
          `/profile/wow/character/${slug(i.realmSlug)}/${slug(i.characterName)}${suffix}`,
          { namespace: wow(i.region, "profile"), locale: i.locale },
        ),
    );
  const searchTool = (path: string, description: string) =>
    query(
      {
        description: `${description} params holds the search fields, for example {"name.en_US":"sword","orderby":"id","_page":1}. namespace defaults to static-<region>. ${regionNote}`,
        input: Search,
      },
      async (_c, i) =>
        send(regionOf(i.region), path, {
          namespace: wow(i.region, "static"),
          locale: i.locale,
          ...(i.params as Params),
        }),
    );

  return router({
    account: router(
      {
        wowProfile: query(
          {
            description:
              "OAuth only (wow.profile scope). List the signed-in player's World of Warcraft accounts and characters. " +
              regionNote,
            input: Base,
          },
          async (_c, i) =>
            send(regionOf(i.region), "/profile/user/wow", { namespace: wow(i.region, "profile"), locale: i.locale }),
        ),
        protectedCharacter: query(
          {
            description:
              "OAuth only (wow.profile scope). Private profile of one of the signed-in player's characters (gold, last login, protected stats). realmId and characterId come from wowProfile. " +
              regionNote,
            input: object({ region, locale, realmId: number(), characterId: number() }),
          },
          async (_c, i) =>
            send(
              regionOf(i.region),
              `/profile/user/wow/protected-character/${i.realmId}-${i.characterId}`,
              { namespace: wow(i.region, "profile"), locale: i.locale },
            ),
        ),
        collectionsMounts: query(
          { description: `OAuth only. Mounts collected by the signed-in player's account. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/profile/user/wow/collections/mounts", {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
        collectionsPets: query(
          { description: `OAuth only. Battle pets collected by the signed-in player's account. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/profile/user/wow/collections/pets", {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
        d3Profile: query(
          {
            description:
              "OAuth or client credentials. Diablo III career profile for a BattleTag written with a dash, for example Name-1234. " +
              regionNote,
            input: object({ region, locale, battletag: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/d3/profile/${enc(i.battletag)}/`, { locale: i.locale }),
        ),
        sc2Profile: query(
          {
            description:
              "OAuth only (sc2.profile scope). StarCraft II profile summary. regionId is 1 (US), 2 (EU), 3 (KR/TW) or 5 (CN); realmId is 1 or 2; profileId is the numeric profile id. " +
              regionNote,
            input: object({ region, locale, regionId: number(), realmId: number(), profileId: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/sc2/profile/${i.regionId}/${i.realmId}/${enc(i.profileId)}`, {
              locale: i.locale,
            }),
        ),
        sc2PlayerAccount: query(
          {
            description:
              "OAuth only (sc2.profile scope). StarCraft II profiles linked to a Battle.net account id (the id returned by userinfo). regionId is 1 (US), 2 (EU), 3 (KR/TW) or 5 (CN).",
            input: object({ region, locale, regionId: number(), accountId: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/sc2/player/${enc(i.accountId)}`, { locale: i.locale }),
        ),
      },
      { title: "Account", description: "The signed-in player's profiles across WoW, Diablo III and StarCraft II." },
    ),
    characters: router(
      {
        profile: character("", "Public profile summary of a World of Warcraft character."),
        status: character("/status", "Whether a character profile is valid and its last-seen id."),
        appearance: character("/appearance", "Character appearance (race, gender, customizations)."),
        equipment: character("/equipment", "Equipped items with stats, enchants and gems."),
        media: character("/character-media", "Character render and avatar images."),
        statistics: character("/statistics", "Character combat, attribute and defense statistics."),
        specializations: character("/specializations", "Active and available specializations and talents."),
        achievements: character("/achievements", "Achievement progress of a character."),
        achievementStatistics: character("/achievements/statistics", "Achievement statistics of a character."),
        professions: character("/professions", "Primary and secondary professions with skill tiers."),
        reputations: character("/reputations", "Faction reputations."),
        titles: character("/titles", "Titles earned and the active title."),
        quests: character("/quests", "Quests in progress."),
        completedQuests: character("/quests/completed", "Completed quests."),
        pvpSummary: character("/pvp-summary", "PvP summary: honor level, honorable kills and brackets."),
        encounters: character("/encounters", "Dungeon and raid encounter summary."),
        raids: character("/encounters/raids", "Raid progress by expansion and difficulty."),
        dungeons: character("/encounters/dungeons", "Dungeon progress."),
        mythicKeystone: character("/mythic-keystone-profile", "Mythic+ rating and best runs."),
        mounts: character("/collections/mounts", "Mounts collected by a character's account."),
        pets: character("/collections/pets", "Battle pets collected by a character's account."),
        toys: character("/collections/toys", "Toys collected by a character's account."),
        heirlooms: character("/collections/heirlooms", "Heirlooms collected by a character's account."),
        transmogs: character("/collections/transmogs", "Transmog appearances collected by a character's account."),
        soulbinds: character("/soulbinds", "Shadowlands soulbinds and conduits."),
        hunterPets: character("/hunter-pets", "Hunter pets of a hunter character."),
      },
      { title: "WoW characters", description: "Public World of Warcraft character profile data." },
    ),
    guilds: router(
      {
        get: query(
          {
            description: `Guild summary. realmSlug and guildSlug are slugs such as area-52 and my-guild. ${regionNote}`,
            input: object({ region, locale, realmSlug: string({ minLength: 1 }), guildSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/guild/${slug(i.realmSlug)}/${slug(i.guildSlug)}`, {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
        roster: query(
          {
            description: `Guild roster with members, ranks and levels. ${regionNote}`,
            input: object({ region, locale, realmSlug: string({ minLength: 1 }), guildSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/guild/${slug(i.realmSlug)}/${slug(i.guildSlug)}/roster`, {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
        activity: query(
          {
            description: `Recent guild activity. ${regionNote}`,
            input: object({ region, locale, realmSlug: string({ minLength: 1 }), guildSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/guild/${slug(i.realmSlug)}/${slug(i.guildSlug)}/activity`, {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
        achievements: query(
          {
            description: `Guild achievements. ${regionNote}`,
            input: object({ region, locale, realmSlug: string({ minLength: 1 }), guildSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/guild/${slug(i.realmSlug)}/${slug(i.guildSlug)}/achievements`, {
              namespace: wow(i.region, "profile"),
              locale: i.locale,
            }),
        ),
      },
      { title: "WoW guilds", description: "Guild summary, roster, activity and achievements." },
    ),
    gameData: router(
      {
        item: dataId((id) => `/data/wow/item/${id}`, "Get a WoW item by id."),
        itemMedia: dataId((id) => `/data/wow/media/item/${id}`, "Get icon assets of a WoW item."),
        itemSearch: searchTool("/data/wow/search/item", "Search WoW items."),
        spell: dataId((id) => `/data/wow/spell/${id}`, "Get a WoW spell by id."),
        spellSearch: searchTool("/data/wow/search/spell", "Search WoW spells."),
        creature: dataId((id) => `/data/wow/creature/${id}`, "Get a WoW creature by id."),
        creatureSearch: searchTool("/data/wow/search/creature", "Search WoW creatures."),
        achievement: dataId((id) => `/data/wow/achievement/${id}`, "Get a WoW achievement by id."),
        achievementIndex: data("/data/wow/achievement/index", "List WoW achievements."),
        playableClassIndex: data("/data/wow/playable-class/index", "List playable classes."),
        playableClass: dataId((id) => `/data/wow/playable-class/${id}`, "Get a playable class by id."),
        playableSpecIndex: data("/data/wow/playable-specialization/index", "List playable specializations."),
        playableSpec: dataId((id) => `/data/wow/playable-specialization/${id}`, "Get a playable specialization by id."),
        playableRaceIndex: data("/data/wow/playable-race/index", "List playable races."),
        mountIndex: data("/data/wow/mount/index", "List mounts."),
        mount: dataId((id) => `/data/wow/mount/${id}`, "Get a mount by id."),
        petIndex: data("/data/wow/pet/index", "List battle pets."),
        pet: dataId((id) => `/data/wow/pet/${id}`, "Get a battle pet by id."),
        professionIndex: data("/data/wow/profession/index", "List professions."),
        profession: dataId((id) => `/data/wow/profession/${id}`, "Get a profession by id."),
        journalExpansionIndex: data("/data/wow/journal-expansion/index", "List Adventure Guide expansions."),
        journalEncounter: dataId((id) => `/data/wow/journal-encounter/${id}`, "Get an Adventure Guide encounter by id."),
        journalInstance: dataId((id) => `/data/wow/journal-instance/${id}`, "Get an Adventure Guide instance by id."),
        questIndex: data("/data/wow/quest/index", "List quests."),
        quest: dataId((id) => `/data/wow/quest/${id}`, "Get a quest by id."),
        titleIndex: data("/data/wow/title/index", "List titles."),
        reputationFactionIndex: data("/data/wow/reputation-faction/index", "List reputation factions."),
        powerTypeIndex: data("/data/wow/power-type/index", "List power types."),
        regionIndex: data("/data/wow/region/index", "List WoW regions."),
      },
      { title: "WoW game data", description: "Static World of Warcraft game data: items, spells, creatures, classes and more." },
    ),
    realmsAndAuctions: router(
      {
        realmIndex: query(
          { description: `List realms. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/realm/index", { namespace: wow(i.region, "dynamic"), locale: i.locale }),
        ),
        realm: query(
          {
            description: `Get one realm by slug (for example area-52). ${regionNote}`,
            input: object({ region, locale, realmSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/realm/${slug(i.realmSlug)}`, {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
        connectedRealmIndex: query(
          { description: `List connected realms. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/connected-realm/index", {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
        connectedRealm: dataId((id) => `/data/wow/connected-realm/${id}`, "Get a connected realm by id.", "dynamic"),
        connectedRealmSearch: query(
          {
            description: `Search connected realms, for example params {"status.type":"UP","realms.timezone":"America/New_York"}. ${regionNote}`,
            input: Search,
          },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/search/connected-realm", {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
              ...(i.params as Params),
            }),
        ),
        auctions: dataId(
          (id) => `/data/wow/connected-realm/${id}/auctions`,
          "Current auctions of a connected realm. Large response.",
          "dynamic",
        ),
        commodities: query(
          { description: `Region-wide commodity auctions. Large response. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/auctions/commodities", {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
        tokenPrice: query(
          { description: `Current WoW Token price in copper. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/token/index", { namespace: wow(i.region, "dynamic"), locale: i.locale }),
        ),
      },
      { title: "WoW realms and auctions", description: "Realm status, auction house and WoW Token price." },
    ),
    competitive: router(
      {
        mythicKeystoneSeasonIndex: query(
          { description: `List Mythic Keystone seasons. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/mythic-keystone/season/index", {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
        mythicKeystoneSeason: dataId(
          (id) => `/data/wow/mythic-keystone/season/${id}`,
          "Get a Mythic Keystone season by id.",
          "dynamic",
        ),
        mythicKeystoneLeaderboard: query(
          {
            description: `Mythic Keystone leaderboard for a connected realm, dungeon and period. ${regionNote}`,
            input: object({ region, locale, connectedRealmId: number(), dungeonId: number(), period: number() }),
          },
          async (_c, i) =>
            send(
              regionOf(i.region),
              `/data/wow/connected-realm/${i.connectedRealmId}/mythic-leaderboard/${i.dungeonId}/period/${i.period}`,
              { namespace: wow(i.region, "dynamic"), locale: i.locale },
            ),
        ),
        pvpSeasonIndex: query(
          { description: `List PvP seasons. ${regionNote}`, input: Base },
          async (_c, i) =>
            send(regionOf(i.region), "/data/wow/pvp-season/index", {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
        pvpLeaderboard: query(
          {
            description: `PvP leaderboard for a season and bracket (for example 2v2, 3v3, rbg). ${regionNote}`,
            input: object({ region, locale, seasonId: number(), bracket: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/wow/pvp-season/${i.seasonId}/pvp-leaderboard/${enc(i.bracket)}`, {
              namespace: wow(i.region, "dynamic"),
              locale: i.locale,
            }),
        ),
      },
      { title: "WoW competitive", description: "Mythic+ and PvP seasons and leaderboards." },
    ),
    diablo3: router(
      {
        hero: query(
          {
            description: `Diablo III hero of a BattleTag (Name-1234). ${regionNote}`,
            input: object({ region, locale, battletag: string({ minLength: 1 }), heroId: number() }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/d3/profile/${enc(i.battletag)}/hero/${i.heroId}`, { locale: i.locale }),
        ),
        heroItems: query(
          {
            description: `Equipped items of a Diablo III hero. ${regionNote}`,
            input: object({ region, locale, battletag: string({ minLength: 1 }), heroId: number() }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/d3/profile/${enc(i.battletag)}/hero/${i.heroId}/items`, { locale: i.locale }),
        ),
        item: query(
          {
            description: `Diablo III item by slug-and-id as listed in game data, for example corrupted-ashbringer-Unique_Sword_2H_104_x1. ${regionNote}`,
            input: object({ region, locale, itemSlugAndId: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/d3/data/item/${enc(i.itemSlugAndId)}`, { locale: i.locale }),
        ),
        seasonIndex: query(
          { description: `List Diablo III seasons. ${regionNote}`, input: Base },
          async (_c, i) => send(regionOf(i.region), "/data/d3/season/", { namespace: wow(i.region, "dynamic"), locale: i.locale }),
        ),
        season: query(
          {
            description: `Diablo III season by id. ${regionNote}`,
            input: object({ region, locale, seasonId: number() }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/data/d3/season/${i.seasonId}`, { namespace: wow(i.region, "dynamic"), locale: i.locale }),
        ),
      },
      { title: "Diablo III", description: "Diablo III heroes, items and seasons." },
    ),
    starcraft2: router(
      {
        ladderSummary: query(
          {
            description: `StarCraft II ladder summary for a profile. ${regionNote}`,
            input: object({ region, locale, regionId: number(), realmId: number(), profileId: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/sc2/profile/${i.regionId}/${i.realmId}/${enc(i.profileId)}/ladder/summary`, {
              locale: i.locale,
            }),
        ),
        ladder: query(
          {
            description: `One StarCraft II ladder of a profile. ${regionNote}`,
            input: object({
              region,
              locale,
              regionId: number(),
              realmId: number(),
              profileId: string({ minLength: 1 }),
              ladderId: string({ minLength: 1 }),
            }),
          },
          async (_c, i) =>
            send(
              regionOf(i.region),
              `/sc2/profile/${i.regionId}/${i.realmId}/${enc(i.profileId)}/ladder/${enc(i.ladderId)}`,
              { locale: i.locale },
            ),
        ),
        legacyProfile: query(
          {
            description: `Legacy StarCraft II profile (campaign, achievements, rewards). ${regionNote}`,
            input: object({ region, locale, regionId: number(), realmId: number(), profileId: string({ minLength: 1 }) }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/sc2/legacy/profile/${i.regionId}/${i.realmId}/${enc(i.profileId)}`, {
              locale: i.locale,
            }),
        ),
        grandmasterLadder: query(
          {
            description: `Current grandmaster ladder for a StarCraft II region id (1 US, 2 EU, 3 KR/TW). ${regionNote}`,
            input: object({ region, locale, regionId: number() }),
          },
          async (_c, i) => send(regionOf(i.region), `/sc2/ladder/grandmaster/${i.regionId}`, { locale: i.locale }),
        ),
        season: query(
          {
            description: `Current StarCraft II season for a region id. ${regionNote}`,
            input: object({ region, locale, regionId: number() }),
          },
          async (_c, i) => send(regionOf(i.region), `/sc2/ladder/season/${i.regionId}`, { locale: i.locale }),
        ),
      },
      { title: "StarCraft II", description: "StarCraft II profiles and ladders." },
    ),
    hearthstone: router(
      {
        searchCards: query(
          {
            description: `Search Hearthstone cards. params may include set, class, manaCost, attack, health, collectible, rarity, type, minionType, keyword, textFilter, gameMode, page, pageSize, sort, order. ${regionNote}`,
            input: Search,
          },
          async (_c, i) =>
            send(regionOf(i.region), "/hearthstone/cards", {
              locale: i.locale,
              ...(i.params as Params),
            }),
        ),
        card: query(
          {
            description: `Get one Hearthstone card by id or slug. ${regionNote}`,
            input: object({ region, locale, idOrSlug: string({ minLength: 1 }) }),
          },
          async (_c, i) => send(regionOf(i.region), `/hearthstone/cards/${enc(i.idOrSlug)}`, { locale: i.locale }),
        ),
        deck: query(
          {
            description: `Decode a Hearthstone deck from its deck code. ${regionNote}`,
            input: object({ region, locale, code: string({ minLength: 1 }) }),
          },
          async (_c, i) => send(regionOf(i.region), "/hearthstone/deck", { locale: i.locale, code: i.code }),
        ),
        metadata: query(
          {
            description: `Hearthstone metadata. type is optional: sets, setGroups, types, rarities, classes, minionTypes, keywords. Omit for all. ${regionNote}`,
            input: object({ region, locale, type: string().optional() }),
          },
          async (_c, i) =>
            send(regionOf(i.region), `/hearthstone/metadata${i.type === undefined ? "" : `/${enc(i.type)}`}`, {
              locale: i.locale,
            }),
        ),
      },
      { title: "Hearthstone", description: "Hearthstone cards, decks and metadata." },
    ),
    request: router(
      {
        get: query(
          {
            description: `Escape hatch: GET any Blizzard API path such as /data/wow/item/19019 or /hearthstone/cards. Pass namespace (for example static-us) and other query parameters in params. The request is read-only. ${regionNote}`,
            input: object({ region, path: string({ minLength: 1 }), params: json().optional() }),
          },
          async (_c, i) => {
            if (!i.path.startsWith("/")) throw new Error("path must start with /");
            return send(regionOf(i.region), i.path, (i.params ?? {}) as Params);
          },
        ),
      },
      { title: "Raw request", description: "Read-only GET for any Blizzard API path." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { battlenet: battlenet.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.battlenet ?? [], (account) => build(client(account, fetch, signal)), { signal }),
      {
        title: "Battle.net",
        description:
          "Blizzard Battle.net APIs: World of Warcraft game data, characters, guilds, auctions and Mythic+/PvP leaderboards, Diablo III, StarCraft II and Hearthstone.",
        icons,
      },
    ),
  }),
);
