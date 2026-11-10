import {
  accountRouter,
  boolean,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://screenshot.fyi/api/take";

const screenshotfyi = defineProvider({
  name: "Screenshot.fyi",
  hosts: ["screenshot.fyi"],
  auth: {
    // The API key is on the Screenshot.fyi dashboard after signing in at https://screenshot.fyi.
    apiKey: secrets({
      label: "API key",
      fields: object({ accessKey: string({ minLength: 1 }) }),
    }),
  },
  // No health check: the API has a single endpoint and every call takes a screenshot that counts against the plan.
});

const take = object({
  url: string({ minLength: 1 }),
  width: number().optional(),
  height: number().optional(),
  format: string().optional(),
  fullPage: boolean().optional(),
  darkMode: boolean().optional(),
  disableCookieBanners: boolean().optional(),
});

function tools(accessKey: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return router({
    screenshots: router({
      take: mutation(
        {
          description:
            "Take a screenshot of a web page and return JSON whose data.url links to the hosted image. Consumes one screenshot of the plan quota. Params: url (required), width and height (viewport pixels), format (e.g. jpg), fullPage (capture the whole page), darkMode, disableCookieBanners.",
          input: take,
        },
        async (_ctx, input) => {
          const target = new URL(base);
          target.searchParams.set("accessKey", accessKey);
          for (const [key, value] of Object.entries(input)) {
            if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
          }
          const response = await fetcher(target.toString(), { signal });
          const text = await response.text();
          let parsed: unknown = text;
          try {
            parsed = JSON.parse(text);
          } catch {
            // Non-JSON bodies are returned as text.
          }
          if (!response.ok) throw new Error(`Screenshot.fyi returned ${response.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
          return parsed;
        },
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { screenshotfyi: screenshotfyi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.screenshotfyi ?? [],
        (account) => withApprovals(tools(account.fields.accessKey, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Screenshot.fyi",
        description: "Take website screenshots with Screenshot.fyi: custom viewport, full page, dark mode, image format and cookie-banner removal.",
        icons,
      },
    ),
  }),
);
