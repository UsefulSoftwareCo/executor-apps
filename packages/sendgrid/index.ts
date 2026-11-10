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
import { specs } from "./openapi.js";

const sendgrid = defineProvider({
  name: "SendGrid",
  hosts: ["api.sendgrid.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /v3/scopes lists the scopes of the calling key; every key may call it.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.sendgrid.com/v3/scopes", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { sendgrid: sendgrid.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sendgrid ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(specs).map(([name, spec]) => [
                name,
                withApprovals(liveOpenapiRouter({ ...spec, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "SendGrid",
        description:
          "Twilio SendGrid: send email, manage marketing contacts, lists and campaigns, templates, suppressions, domain authentication, stats and account settings.",
        icons,
        instructions:
          "Tools are grouped by product area (mail, mcContacts, mcLists, templates, suppressions, ...). Sending mail is mail.*. An API key only works for the scopes it was created with.",
      },
    ),
  }),
);
