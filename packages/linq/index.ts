import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  json,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, whatsappOptions } from "./openapi.js";

const auth = (label: string) => ({
  apiKey: secrets({ label, fields: object({ token: string({ minLength: 1 }) }) }),
});

const linq = defineProvider({
  name: "Linq",
  hosts: ["api.linqapp.com"],
  auth: auth("API token"),
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.linqapp.com/api/partner/v3/phone_numbers", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ phone_numbers: array(json()) }));
  },
});

const linqWhatsapp = defineProvider({
  name: "Linq WhatsApp",
  hosts: ["whatsapp.messages.api.linqapp.com"],
  auth: auth("WhatsApp API key"),
  async health({ account, fetch, signal }) {
    const response = await fetch("https://whatsapp.messages.api.linqapp.com/v1/phone_numbers", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: array(json()) }));
  },
});

// Mutations are approved. getPaymentCredentials is a GET but hands out the token for revealing a card.
const approve = (tool: { kind: string }, name: string) =>
  tool.kind === "mutation" || /(^|\.)getPaymentCredentials$/.test(name) ? always() : undefined;

export default defineApp(
  { user: { accounts: { linq: linq.many(), linqWhatsapp: linqWhatsapp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        imessage: await accountRouter(
          user?.accounts.linq ?? [],
          (account) => withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), approve),
          { signal },
        ),
        whatsapp: await accountRouter(
          user?.accounts.linqWhatsapp ?? [],
          (account) => withApprovals(liveOpenapiRouter({ ...whatsappOptions, cache, fetch, signal, account }), approve),
          { signal },
        ),
      },
      {
        title: "Linq",
        description:
          "Linq messaging. imessage: iMessage, RCS and SMS chats, messages, attachments, phone numbers, webhooks and payments. whatsapp: WhatsApp chats, messages, templates, media and webhooks (separate key).",
        icons,
      },
    ),
  }),
);
