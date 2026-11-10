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

const smartrecruiters = defineProvider({
  name: "SmartRecruiters",
  hosts: ["api.smartrecruiters.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.smartrecruiters.com/users/me", {
      signal,
      headers: { "x-smarttoken": account.fields.token, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { smartrecruiters: smartrecruiters.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.smartrecruiters ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SmartRecruiters",
        description:
          "Jobs, postings, candidates, applications, interviews, offers, users, configuration and webhooks in SmartRecruiters.",
        icons,
      },
    ),
  }),
);
