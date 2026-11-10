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
import { options } from "./openapi.js";

const genderapiio = defineProvider({
  name: "GenderAPI.io",
  hosts: ["api.genderapi.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /usage is free. A bad key silently falls back to the IP trial, so this only proves reachability.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.genderapi.io/api/v2/usage", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { genderapiio: genderapiio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.genderapiio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GenderAPI.io",
        description: "Predict gender from names, emails and usernames, validate phone numbers, and check credit usage with GenderAPI.io.",
        icons,
      },
    ),
  }),
);
