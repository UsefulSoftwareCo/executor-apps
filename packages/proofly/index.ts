import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://proofly.io/api";

const proofly = defineProvider({
  name: "Proofly",
  hosts: ["proofly.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { "X-Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ ok: boolean() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "X-Api-Key": account.fields.token, Accept: "application/json" });

const prooflyTools = (account: Account, signal: AbortSignal) =>
  router({
    getUser: query(
      {
        description:
          "Get the authenticated Proofly user: name, email, login and registration metadata, impressions for the period and in total, and the pixel key.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/user`, { signal, headers: headers(account) }), json()),
    ),
    getActivity: query(
      {
        description: "List recent account activity logs (event type such as login.success, IP address, date).",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/activity`, { signal, headers: headers(account) }), json()),
    ),
    listCampaigns: query(
      {
        description: "List all campaigns in the account with id, name, domain, enabled state and creation date.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/campaigns`, { signal, headers: headers(account) }), json()),
    ),
    getCampaign: query(
      {
        description:
          "List the notifications in one campaign with type, trigger and display settings, stats (impressions, hovers, clicks, leads) and enabled state. Get campaignId from listCampaigns.",
        input: object({ campaignId: number() }),
      },
      async ({ fetch }, { campaignId }) =>
        decodeJson(await fetch(`${base}/campaign/${campaignId}`, { signal, headers: headers(account) }), json()),
    ),
    getNotificationData: query(
      {
        description:
          "Get the data, leads and conversions collected by one notification (input, IP, URL, location, date). Get notificationId from getCampaign.",
        input: object({ notificationId: number() }),
      },
      async ({ fetch }, { notificationId }) =>
        decodeJson(await fetch(`${base}/data/${notificationId}`, { signal, headers: headers(account) }), json()),
    ),
    toggleCampaign: mutation(
      {
        description:
          "Toggle a campaign between active and inactive. The API flips the current state; the response states whether it is now enabled or disabled. Get campaignId from listCampaigns.",
        input: object({ campaignId: number() }),
        approval: always(),
      },
      async ({ fetch }, { campaignId }) =>
        decodeJson(
          await fetch(`${base}/campaign/${campaignId}`, { method: "PUT", signal, headers: headers(account) }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { proofly: proofly.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.proofly ?? [], (account) => prooflyTools(account, signal), { signal }), {
    title: "Proofly",
    description: "Social proof notification toolkit: inspect campaigns, notifications, collected leads and activity, and toggle campaigns.",
    icons,
  }),
}));
