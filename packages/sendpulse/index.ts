import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { specs } from "./openapi.js";

const sendpulse = defineProvider({
  name: "SendPulse",
  hosts: ["api.sendpulse.com"],
  auth: {
    // Static API key from Account settings, API; SendPulse accepts it as a bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // REST API ID and secret from the same page, exchanged for one-hour bearer tokens.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.sendpulse.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.sendpulse.com/balance", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({ currency: string() }));
  },
});

export default defineApp(
  { user: { accounts: { sendpulse: sendpulse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sendpulse ?? [],
        (account) => {
          const mount = (options: (typeof specs)[keyof typeof specs]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(specs).map(([key, options]) => [key, mount(options)])) as {
              [K in keyof typeof specs]: ReturnType<typeof mount>;
            },
            { title: "SendPulse", description: "SendPulse account." },
          );
        },
        { signal },
      ),
      {
        title: "SendPulse",
        description:
          "SendPulse marketing platform. email: address books and campaigns. smtp: transactional email. sms, viber, webPush, popups, verifier. crm, automation360, education, fileManager, liveChat. chatbots, facebook, instagram, telegram, tiktok, viberChatbots, whatsapp.",
        icons,
      },
    ),
  }),
);
