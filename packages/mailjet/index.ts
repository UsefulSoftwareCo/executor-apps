import { accountRouter, decodeJson, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { contentOptions, emailOptions } from "./openapi.js";

const mailjet = defineProvider({
  name: "Mailjet",
  hosts: ["api.mailjet.com"],
  auth: {
    // Account settings > API Key Management: https://app.mailjet.com/account/apikeys
    apiKey: secrets({
      label: "API key and secret key",
      fields: object({ apiKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mailjet.com/v3/REST/myprofile", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.apiKey}:${account.fields.secretKey}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mailjet: mailjet.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        email: await accountRouter(
          user?.accounts.mailjet ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...emailOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        content: await accountRouter(
          user?.accounts.mailjet ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...contentOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Mailjet",
        description:
          "Send and manage email with Mailjet: transactional sending, contacts and lists, campaigns, statistics, webhooks, senders, plus templates, images and labels through the Content API.",
        instructions:
          "email holds the Email API (v3 and v3.1, including send); content holds the Content API (v1: templates, template content, images, labels).",
        icons,
      },
    ),
  }),
);
