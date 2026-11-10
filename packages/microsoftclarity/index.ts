import {
  accountRouter,
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

const endpoint = "https://www.clarity.ms/export-data/api/v1/project-live-insights";

// No health check: the export API allows only 10 requests per project per day and has no
// cheaper endpoint, so probing on every account check would burn the quota.
const clarity = defineProvider({
  name: "Microsoft Clarity",
  hosts: ["www.clarity.ms"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

type Account = { fields: { token: string } };

const dimensions =
  "Browser, Device, Country/Region, OS, Source, Medium, Campaign, Channel or URL";

const clarityTools = (account: Account, signal: AbortSignal) =>
  router({
    liveInsights: query(
      {
        description:
          "Export the Clarity project's dashboard data for the last 1, 2 or 3 days (numOfDays, default 1), UTC. Returns a list of metrics (Traffic, Engagement Time, Scroll Depth, Popular Pages, Dead Click Count, Rage Click Count, Excessive Scroll, Quickback Click, Script Error Count, Error Click Count and more), each with rows of values. Optionally break rows down by up to three dimensions, each one of: " +
          dimensions +
          ". Quota: 10 requests per project per day, at most 1,000 rows per response, no pagination. The token is tied to one project.",
        input: object({
          numOfDays: number().default(1),
          dimension1: string().optional(),
          dimension2: string().optional(),
          dimension3: string().optional(),
        }),
      },
      async ({ fetch }, input) => {
        const params = new URLSearchParams({ numOfDays: String(input.numOfDays) });
        for (const key of ["dimension1", "dimension2", "dimension3"] as const) {
          const value = input[key];
          if (value !== undefined) params.set(key, value);
        }
        return decodeJson(
          await fetch(`${endpoint}?${params}`, {
            signal,
            headers: {
              Authorization: `Bearer ${account.fields.token}`,
              "Content-Type": "application/json",
            },
          }),
          json(),
        );
      },
    ),
  });

export default defineApp({ user: { accounts: { clarity: clarity.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.clarity ?? [], (account) => clarityTools(account, signal), { signal }), {
    title: "Microsoft Clarity",
    description: "Export Microsoft Clarity project insights: traffic, engagement, scroll depth and frustration signals by dimension.",
    icons,
  }),
}));
