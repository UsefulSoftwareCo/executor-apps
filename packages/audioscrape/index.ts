import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.audioscrape.com";

// The vendor docs publish no tool annotations and class create_share_link as
// read-only although it generates a share URL. Only these documented read
// tools skip approval, and only when the server also marks them read-only.
const knownReadTools = new Set([
  "search_audio",
  "get_episode_overview",
  "get_transcript",
  "list_recent_transcripts",
  "search_podcasts",
  "list_podcast_episodes",
  "search_speakers",
  "get_speaker",
  "search_entities",
  "get_trending",
  "get_charts",
  "get_transcription_status",
  "list_my_datasets",
  "list_my_uploads",
]);

type Account =
  | { method: "apiKey"; fields: { apiKey: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.apiKey}`,
});

const audioscrape = defineProvider({
  name: "Audioscrape",
  hosts: ["mcp.audioscrape.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { audioscrape: audioscrape.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.audioscrape ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool, name) =>
            knownReadTools.has(name.split(".").pop() ?? name) && toolAnnotations(tool)?.readOnlyHint === true
              ? undefined
              : always(),
          ),
        { signal },
      ),
      {
        title: "Audioscrape",
        description: "Search and retrieve speaker-attributed audio, transcripts, entities and citations.",
        icons,
      },
    ),
  }),
);
