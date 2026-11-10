import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const regions = ["us-east-1", "us-west-2", "eu-central-1", "ap-northeast-1"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error(`Region must be one of: ${regions.join(", ")}.`);
  return `https://${region}.recall.ai`;
}

const recallai = defineProvider({
  name: "Recall.ai",
  hosts: regions.map((region) => `${region}.recall.ai`),
  auth: {
    // Recall dashboard > API Keys. The key belongs to one region's workspace.
    apiKey: secrets({
      label: "Region and API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/api/v2/calendar-events/?page_size=1`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Recall.ai rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { recallai: recallai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.recallai ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Recall.ai",
        description:
          "Recall.ai meeting bots and conversation data: send bots to Zoom, Meet, Teams and Webex calls, and read recordings, transcripts, participant events, calendars, Zoom OAuth apps and Google logins.",
        instructions:
          "The account's region (us-east-1, us-west-2, eu-central-1 or ap-northeast-1) must match the region of the Recall.ai workspace that issued the API key. Calendar-user endpoints that need a calendar auth token are not covered.",
        icons,
      },
    ),
  }),
);
