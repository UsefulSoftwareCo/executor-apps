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

const servers = ["kf.kobotoolbox.org", "eu.kobotoolbox.org"];

function originFor(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!servers.includes(host)) throw new Error("Server must be one of: kf.kobotoolbox.org, eu.kobotoolbox.org.");
  return `https://${host}`;
}

const kobotoolbox = defineProvider({
  name: "KoboToolbox",
  hosts: servers,
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        server: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.server)}/me/`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ username: string() }));
  },
});

export default defineApp(
  { user: { accounts: { kobotoolbox: kobotoolbox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kobotoolbox ?? [],
        (account) => {
          const origin = originFor(account.fields.server);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "KoboToolbox",
        description:
          "KoboToolbox data collection: survey projects (assets), forms, submissions, exports, permissions, hooks and users.",
        instructions:
          "The account's server (kf.kobotoolbox.org global or eu.kobotoolbox.org European) selects the KoboToolbox instance; use the host you log in to.",
        icons,
      },
    ),
  }),
);
