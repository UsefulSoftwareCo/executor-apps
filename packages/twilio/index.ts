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
      label:
        "Account SID (AC...), then Username and Password. Use the Account SID as Username and the Auth Token as Password, or an API Key SID (SK...) as Username and its secret as Password",
      fields: object({
        accountSid: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
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
