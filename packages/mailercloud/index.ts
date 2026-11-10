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
import { emailOptions, marketingOptions } from "./openapi.js";

const mailercloud = defineProvider({
  name: "Mailercloud",
  hosts: ["cloudapi.mailercloud.com", "email-api.mailercloud.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://cloudapi.mailercloud.com/v1/client/plan", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mailercloud: mailercloud.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailercloud ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              marketing: approve(liveOpenapiRouter({ ...marketingOptions, cache, fetch, signal, account })),
              email: approve(liveOpenapiRouter({ ...emailOptions, cache, fetch, signal, account })),
            },
            { title: "Mailercloud", description: "Mailercloud account." },
          );
        },
        { signal },
      ),
      {
        title: "Mailercloud",
        description:
          "Mailercloud email marketing. marketing: campaigns, contacts, lists, segments, tags, custom properties, templates, webhooks, automations, senders, webforms. email: transactional and personalized sending, suppressions, inbox tracking.",
        icons,
      },
    ),
  }),
);
