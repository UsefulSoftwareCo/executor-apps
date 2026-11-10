import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.dfoneople.com";

const dfo = defineProvider({
  name: "Dungeon Fighter Online",
  hosts: ["api.dfoneople.com"],
  auth: {
    apiKey: secrets({
      label: "Neople Open API key",
      fields: object({ token: string({ minLength: 1 }) }),
      request: ({ token }) => query("apikey", token),
    }),
  },
  async health({ account, fetch, signal }) {
    // Server list is a keyed read-only call; only the 2xx status is checked.
    const response = await fetch(account.url(`${base}/df/servers`), { signal, headers: account.headers() });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Neople authenticates with an `apikey` query parameter. Every call here is a read.
function client(account: { url(url: string): string; headers(): Record<string, string> }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(account.url(url.toString()), { signal, headers: account.headers() });
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const req = () => string({ minLength: 1 });
const seg = encodeURIComponent;

const character = { serverId: req(), characterId: req() };
const characterPath = (serverId: string, characterId: string) => `/df/servers/${seg(serverId)}/characters/${seg(characterId)}`;

function build(call: ReturnType<typeof client>) {
  const characterRead = (description: string, suffix: string) =>
    query({ description, input: object(character) }, (_c, { serverId, characterId }) => call(`${characterPath(serverId, characterId)}${suffix}`));

  const characters = router(
    {
      search: query(
        {
          description:
            "Search characters by name. serverId may be 'all'. wordType is 'match' (default) or 'full'. limit defaults to 10, max 50. jobGrowId requires jobId.",
          input: object({
            serverId: req(),
            characterName: req(),
            jobId: optStr(),
            jobGrowId: optStr(),
            isAllJobGrow: optBool(),
            wordType: optStr(),
            limit: optNum(),
          }),
        },
        (_c, { serverId, ...p }) => call(`/df/servers/${seg(serverId)}/characters`, p),
      ),
      get: characterRead("Basic information for a character.", ""),
      status: characterRead("Character stats. Only characters that logged in within the last year.", "/status"),
      equipment: characterRead("Equipped equipment of a character.", "/equip/equipment"),
      avatar: characterRead("Equipped avatar of a character.", "/equip/avatar"),
      creature: characterRead("Equipped creature of a character.", "/equip/creature"),
      oath: characterRead("Equipped oath crystals of a character.", "/equip/oath"),
      mistAssimilation: characterRead("Mist assimilation equipment of a character.", "/equip/mist-assimilation"),
      skillStyle: characterRead("Skill style of a character (excludes skill boosts from items).", "/skill/style"),
      buffEquipment: characterRead("Equipment used for the buff skill of a character.", "/skill/buff/equip/equipment"),
      buffAvatar: characterRead("Avatar used for the buff skill of a character.", "/skill/buff/equip/avatar"),
      buffCreature: characterRead("Creature used for the buff skill of a character.", "/skill/buff/equip/creature"),
      fameRanking: query(
        {
          description:
            "Fame ranking for a server (level 110+ characters active within 90 days; range capped at 10,000). isBuff true = buffers, false = damage dealers. limit defaults to 10, max 200.",
          input: object({
            serverId: req(),
            minFame: optNum(),
            maxFame: optNum(),
            jobId: optStr(),
            jobGrowId: optStr(),
            isAllJobGrow: optBool(),
            isBuff: optBool(),
            limit: optNum(),
          }),
        },
        (_c, { serverId, ...p }) => call(`/df/servers/${seg(serverId)}/characters-fame`, p),
      ),
    },
    { title: "Characters", description: "Search characters and read their stats, equipment, avatars, creatures and buff setups." },
  );

  const items = router(
    {
      search: query(
        {
          description:
            "Search items by itemName or hashtag (one is required; hashtags comma-separated). wordType is match (default), front or full. limit defaults to 10, max 30. q filters, such as 'minLevel:50,maxLevel:100,rarity:Epic'.",
          input: object({ itemName: optStr(), hashtag: optStr(), wordType: optStr(), limit: optNum(), q: optStr() }),
        },
        (_c, p) => {
          if (!p.itemName?.trim() && !p.hashtag?.trim()) throw new Error("items.search requires itemName or hashtag.");
          return call("/df/items", p);
        },
      ),
      get: query({ description: "Detail for an item by itemId.", input: object({ itemId: req() }) }, (_c, { itemId }) => call(`/df/items/${seg(itemId)}`)),
      shop: query(
        { description: "Shops that sell an item, by itemId.", input: object({ itemId: req() }) },
        (_c, { itemId }) => call(`/df/items/${seg(itemId)}/shop`),
      ),
      getMany: query(
        { description: "Detail for up to 15 items. itemIds is comma-separated.", input: object({ itemIds: req() }) },
        (_c, p) => call("/df/multi/items", p),
      ),
      hashtags: query({ description: "List item hashtags usable with items.search.", input: object({}) }, () => call("/df/item-hashtag")),
    },
    { title: "Items", description: "Search and read items." },
  );

  const setItems = router(
    {
      search: query(
        { description: "Search set items by name. limit defaults to 10, max 100.", input: object({ setItemName: req(), wordType: optStr(), limit: optNum() }) },
        (_c, p) => call("/df/setitems", p),
      ),
      get: query(
        { description: "Detail for a set item by setItemId.", input: object({ setItemId: req() }) },
        (_c, { setItemId }) => call(`/df/setitems/${seg(setItemId)}`),
      ),
    },
    { title: "Set items", description: "Search and read item sets." },
  );

  const skills = router(
    {
      list: query(
        { description: "Skills of a job. jobGrowId is the advancement id from jobs.list.", input: object({ jobId: req(), jobGrowId: req() }) },
        (_c, { jobId, ...p }) => call(`/df/skills/${seg(jobId)}`, p),
      ),
      get: query(
        { description: "Detail for one skill of a job.", input: object({ jobId: req(), skillId: req() }) },
        (_c, { jobId, skillId }) => call(`/df/skills/${seg(jobId)}/${seg(skillId)}`),
      ),
      getMany: query(
        { description: "Detail for up to 10 skills of a job. skillIds is comma-separated.", input: object({ jobId: req(), skillIds: req() }) },
        (_c, { jobId, ...p }) => call(`/df/multi/skills/${seg(jobId)}`, p),
      ),
    },
    { title: "Skills", description: "Read job skills." },
  );

  return router({
    servers: query({ description: "List game servers and their serverIds.", input: object({}) }, () => call("/df/servers")),
    jobs: query({ description: "List jobs and their advancements (jobId, jobGrowId).", input: object({}) }, () => call("/df/jobs")),
    characters,
    items,
    setItems,
    skills,
  });
}

export default defineApp(
  { user: { accounts: { dungeonfighteronline: dfo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.dungeonfighteronline ?? [], (account) => build(client(account, fetch, signal)), { signal }),
      {
        title: "Dungeon Fighter Online",
        description: "Dungeon Fighter Online game data from Neople: servers, characters, equipment, fame rankings, items, set items, jobs and skills.",
        icons,
        instructions:
          "Get serverId from servers (for example cain, siroco; 'all' works for character search). Search characters to get a characterId, then read its details. Job and skill ids come from jobs.",
      },
    ),
  }),
);
