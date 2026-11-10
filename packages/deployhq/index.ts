import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

// Every DeployHQ account lives on its own host: https://<account>.deployhq.com.
function normalizeAccount(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.deployhq\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null)
    throw new Error("Enter the <account> of <account>.deployhq.com (letters, digits, hyphens).");
  return match[1]!;
}

const deployhq = defineProvider({
  name: "DeployHQ",
  hosts: ["*.deployhq.com"],
  auth: {
    // DeployHQ authenticates with HTTP Basic: the login email and the 40-character API key
    // from Settings > Security. It offers no OAuth for third-party apps.
    apiKey: secrets({
      label: "Email and API key",
      fields: object({
        account: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const name = normalizeAccount(account.fields.account);
    const response = await fetch(`https://${name}.deployhq.com/account`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.email}:${account.fields.apiKey}`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: name, displayName: `${name}.deployhq.com`, email: account.fields.email } };
  },
});

export default defineApp(
  { user: { accounts: { deployhq: deployhq.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.deployhq ?? [],
        (account) => {
          const origin = `https://${normalizeAccount(account.fields.account)}.deployhq.com`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "DeployHQ",
        description:
          "Projects, servers, deployments, repositories, build commands, config files, environment variables and account settings in DeployHQ.",
        icons,
      },
    ),
  }),
);
