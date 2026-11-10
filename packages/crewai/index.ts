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

function originFor(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim().includes("://") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    throw new Error("Crew URL must look like https://your-crew.crewai.com.");
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".crewai.com")) {
    throw new Error("Crew URL must be an https://<crew>.crewai.com address from the CrewAI AMP dashboard.");
  }
  return url.origin;
}

const crewai = defineProvider({
  name: "CrewAI",
  hosts: ["*.crewai.com"],
  auth: {
    apiKey: secrets({
      label: "Crew bearer token",
      fields: object({
        crewUrl: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.crewUrl)}/inputs`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`CrewAI rejected the crew URL or token (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { crewai: crewai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.crewai ?? [],
        (account) => {
          const origin = originFor(account.fields.crewUrl);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "CrewAI",
        description: "Run a deployed CrewAI AMP crew: get required inputs, start executions, check status and resume human-in-the-loop runs.",
        instructions:
          "Each account is one deployed crew (its URL and bearer token). Call the inputs tool first, then kickoff, then poll status with the returned kickoff_id.",
        icons,
      },
    ),
  }),
);
