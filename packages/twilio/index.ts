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
import { mounts } from "./openapi.js";

const twilio = defineProvider({
  name: "Twilio",
  hosts: ["*.twilio.com"],
  auth: {
    apiKey: secrets({
      label: "Auth token or API key",
      guide: `
        Sign in with your Auth Token or, better, an API key. Find your Account SID and Auth Token
        on the [Twilio Console](https://console.twilio.com) home page, and create API keys under
        [API keys & tokens](https://console.twilio.com/us1/account/keys-credentials/api-keys).
      `,
      fields: object({
        accountSid: plain(
          string({ minLength: 1, title: "Account SID", description: "Starts with `AC`." }),
        ),
        username: plain(
          string({
            minLength: 1,
            title: "Username",
            description: "Your Account SID again, or an API key's SID (starts with `SK`).",
          }),
        ),
        password: string({
          minLength: 1,
          title: "Password",
          description: "Your Auth Token, or the API key's secret.",
        }),
      }),
    }),
  },
  // Standard API keys are barred from the Accounts resource, so probe a read-only list under the account instead.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account.fields.accountSid)}/Messages.json?PageSize=1`,
      {
        signal,
        headers: { Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}` },
      },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { twilio: twilio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.twilio ?? [],
        (account) => {
          const mount = (options: (typeof mounts)[keyof typeof mounts]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(mounts).map(([key, options]) => [key, mount(options)])) as {
              [K in keyof typeof mounts]: ReturnType<typeof mount>;
            },
            { title: "Twilio", description: "Twilio account." },
          );
        },
        { signal },
      ),
      {
        title: "Twilio",
        description:
          "Twilio. api: SMS/MMS messages, calls, recordings, phone numbers, queues, conferences, usage and subaccounts. messaging: services, sender pools, A2P brand and campaign registration. verify: OTP verification services. lookups: phone number lookup. conversations, content, voice, numbers, studio, taskrouter, sync, proxy, trusthub, video, serverless, trunking, wireless, supersim, pricing, events, intelligence.",
        icons,
        instructions:
          "Most resource paths take the Account SID in the path (for example api: /Accounts/{AccountSid}/Messages.json). The connection's Account SID is stored with the account (the Username may be an API Key SID, not the Account SID), so ask the user for the Account SID if it is not already known and pass it as AccountSid on each call.",
      },
    ),
  }),
);
