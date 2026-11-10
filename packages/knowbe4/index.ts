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
import { options } from "./openapi.js";

const regionPattern = /^(us|eu|ca|uk|de)$/;

function origin(account: { fields: { region: string } }) {
  const region = account.fields.region.trim().toLowerCase();
  if (!regionPattern.test(region)) throw new Error("Enter your KnowBe4 region: us, eu, ca, uk or de.");
  return `https://${region}.api.knowbe4.com`;
}

const knowbe4 = defineProvider({
  name: "KnowBe4",
  hosts: ["us.api.knowbe4.com", "eu.api.knowbe4.com", "ca.api.knowbe4.com", "uk.api.knowbe4.com", "de.api.knowbe4.com"],
  auth: {
    apiKey: secrets({
      label: "Region and Reporting API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/v1/account`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { knowbe4: knowbe4.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.knowbe4 ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin(account), baseUrl: origin(account), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "KnowBe4",
        description:
          "KnowBe4 security awareness training (Reporting API): account, users, groups, risk scores, phishing campaigns and security tests, training campaigns, enrollments, store purchases and policies.",
        icons,
      },
    ),
  }),
);
