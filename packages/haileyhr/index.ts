import {
  accountRouter,
  decodeJson,
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

// Hailey runs a production and a demo environment, each on its own API host.
function originOf(environment: string): string {
  const env = environment.trim().toLowerCase();
  if (env === "haileyhr.app" || env === "") return "https://api.haileyhr.app";
  if (env === "demo.haileyhr.app" || env === "demo") return "https://api.demo.haileyhr.app";
  throw new Error("Environment must be haileyhr.app or demo.haileyhr.app.");
}

const hailey = defineProvider({
  name: "Hailey HR",
  hosts: ["api.haileyhr.app", "api.demo.haileyhr.app"],
  auth: {
    // Admins create a personal access token under avatar > Access tokens in Hailey.
    apiKey: secrets({
      label: "Personal access token",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originOf(account.fields.environment)}/Company`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { hailey: hailey.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hailey ?? [],
        (account) => {
          const origin = originOf(account.fields.environment);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Hailey HR",
        description:
          "Employees, employments, salaries, time off, clock in/out, competences, educations, certificates and company data in Hailey HR.",
        icons,
      },
    ),
  }),
);
