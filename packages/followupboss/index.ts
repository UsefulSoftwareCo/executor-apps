import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ id: number(), name: string() });

const followupboss = defineProvider({
  name: "Follow Up Boss",
  hosts: ["api.followupboss.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // The API key is the Basic username; the password stays empty.
    const headers = { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` };
    const response = await fetch("https://api.followupboss.com/v1/me", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.id), username: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { followupboss: followupboss.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.followupboss ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Follow Up Boss",
        description:
          "Real estate CRM: people, events, deals, tasks, notes, calls, appointments, action plans, automations, pipelines, webhooks and more.",
        icons,
      },
    ),
  }),
);
