import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const calendarhero = defineProvider({
  name: "CalendarHero",
  hosts: ["api.calendarhero.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Follows the Swagger apiKey scheme (Authorization header); the exact format is not separately documented by CalendarHero, so the raw token is sent.
    const response = await fetch("https://api.calendarhero.com/user", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { calendarhero: calendarhero.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.calendarhero ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CalendarHero",
        description: "Manage CalendarHero meetings, meeting tasks, contacts, meeting types, webhooks and user settings.",
        icons,
      },
    ),
  }),
);
