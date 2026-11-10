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

// Every Sendbird application has its own host: https://api-<applicationId>.sendbird.com.
function normalizeAppId(raw: string): string {
  const match = /^(?:https?:\/\/)?(?:api-)?([A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]|[A-Za-z0-9])(?:\.sendbird\.com)?(?:\/v3)?\/?$/i.exec(
    raw.trim(),
  );
  if (match === null)
    throw new Error("Enter the application ID of api-<applicationId>.sendbird.com (letters, digits, hyphens).");
  return match[1]!;
}

// The Application ID is case-sensitive in the dashboard; DNS hostnames are not, so lowercase only for the host.
const originFor = (appId: string): string => `https://api-${appId.toLowerCase()}.sendbird.com`;

const sendbird = defineProvider({
  name: "Sendbird",
  hosts: ["*.sendbird.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        applicationId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Lists one user to verify the application ID and the master or secondary API token.
  async health({ account, fetch, signal }) {
    const appId = normalizeAppId(account.fields.applicationId);
    const response = await fetch(`${originFor(appId)}/v3/users?limit=1`, {
      signal,
      headers: { "Api-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: appId, displayName: `Sendbird ${appId}` } };
  },
});

export default defineApp(
  { user: { accounts: { sendbird: sendbird.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sendbird ?? [],
        (account) => {
          const origin = originFor(normalizeAppId(account.fields.applicationId));
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Sendbird",
        description:
          "Manage Sendbird Chat: users, group and open channels, messages, moderation, announcements, bots, metadata and statistics.",
        icons,
      },
    ),
  }),
);
