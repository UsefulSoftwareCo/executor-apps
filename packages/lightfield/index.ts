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

const lightfield = defineProvider({
  name: "Lightfield",
  hosts: ["api.lightfield.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.lightfield.app/v1/auth/validate", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Lightfield-Version": "2026-03-01" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lightfield: lightfield.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lightfield ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lightfield",
        description:
          "Work with the Lightfield CRM: accounts, contacts, opportunities, meetings, notes, tasks, lists, emails, files and sequences.",
        icons,
      },
    ),
  }),
);
