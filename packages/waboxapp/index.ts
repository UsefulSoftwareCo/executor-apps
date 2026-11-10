import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.waboxapp.com/api";

const waboxapp = defineProvider({
  name: "Waboxapp",
  hosts: ["www.waboxapp.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        token: string({ minLength: 1 }),
        uid: string({ minLength: 1 }),
      }),
    }),
  },
  // The status endpoint is read-only and always answers with success plus the account uid.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/status/${encodeURIComponent(account.fields.uid)}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: account.fields.token }).toString(),
    });
    await decodeJson(response, object({ uid: string() }));
  },
});

type Fetch = typeof fetch;

function client(token: string, uid: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, fields: Record<string, string | undefined> = {}) => {
    const form = new URLSearchParams({ token });
    for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.set(key, value);
    const response = await fetcher(`${base}/${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    return decodeJson(response, json());
  };
}

const to = string({ minLength: 1 });
const toDesc = "to is the recipient's WhatsApp number with international code and no plus sign, e.g. 34666789123.";
const uidDesc = "customUid must be unique per message (a random one is generated when omitted) and is echoed back on ACK webhook events.";

function build(call: ReturnType<typeof client>, uid: string) {
  const send = (path: string, fields: Record<string, string | undefined>, customUid: string | undefined) =>
    call(path, { uid, custom_uid: customUid ?? crypto.randomUUID(), ...fields });

  return router({
    messages: router(
      {
        sendChat: mutation(
          {
            description: `Send a WhatsApp text message from the connected number. ${toDesc} ${uidDesc}`,
            input: object({ to, text: string({ minLength: 1 }), customUid: string().optional() }),
          },
          async (_ctx, i) => send("send/chat", { to: i.to, text: i.text }, i.customUid),
        ),
        sendImage: mutation(
          {
            description: `Send an image from a public URL. ${toDesc} ${uidDesc}`,
            input: object({
              to,
              url: string({ minLength: 1 }),
              caption: string().optional(),
              description: string().optional(),
              customUid: string().optional(),
            }),
          },
          async (_ctx, i) =>
            send("send/image", { to: i.to, url: i.url, caption: i.caption, description: i.description }, i.customUid),
        ),
        sendLink: mutation(
          {
            description: `Send a link with a preview. Caption, description and thumbnail default to the page metadata. ${toDesc} ${uidDesc}`,
            input: object({
              to,
              url: string({ minLength: 1 }),
              caption: string().optional(),
              description: string().optional(),
              urlThumb: string().optional(),
              customUid: string().optional(),
            }),
          },
          async (_ctx, i) =>
            send(
              "send/link",
              { to: i.to, url: i.url, caption: i.caption, description: i.description, url_thumb: i.urlThumb },
              i.customUid,
            ),
        ),
        sendMedia: mutation(
          {
            description: `Send any kind of file from a public URL. ${toDesc} ${uidDesc}`,
            input: object({
              to,
              url: string({ minLength: 1 }),
              caption: string().optional(),
              description: string().optional(),
              urlThumb: string().optional(),
              customUid: string().optional(),
            }),
          },
          async (_ctx, i) =>
            send(
              "send/media",
              { to: i.to, url: i.url, caption: i.caption, description: i.description, url_thumb: i.urlThumb },
              i.customUid,
            ),
        ),
      },
      { title: "Messages", description: "Send WhatsApp messages." },
    ),
    account: router(
      {
        getStatus: query(
          {
            description:
              "Get the connected account's status: alias, phone platform, battery, charging state, locale and webhook URL.",
            input: object({}),
          },
          async () => call(`status/${encodeURIComponent(uid)}`),
        ),
      },
      { title: "Account", description: "Connected WhatsApp account." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { waboxapp: waboxapp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.waboxapp ?? [],
        (account) =>
          withApprovals(
            build(client(account.fields.token, account.fields.uid, fetch, signal), account.fields.uid),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Waboxapp",
        description: "Send WhatsApp messages (text, images, links, files) and check account status with the waboxapp API.",
        icons,
      },
    ),
  }),
);
