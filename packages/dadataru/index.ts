import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { cleanerOptions, profileOptions, suggestionsOptions } from "./openapi.js";

const dadata = defineProvider({
  name: "DaData.ru",
  hosts: ["suggestions.dadata.ru", "cleaner.dadata.ru", "dadata.ru"],
  auth: {
    apiKey: secrets({
      label: "API key and secret key",
      fields: object({ token: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  // The Profile API needs both the API key and the secret key and costs nothing.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://dadata.ru/api/v2/profile/balance", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, "X-Secret": account.fields.secret },
    });
    await decodeJson(response, object({ balance: number() }));
  },
});

export default defineApp(
  { user: { accounts: { dadata: dadata.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dadata ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { suggestions: mount(suggestionsOptions), cleaner: mount(cleanerOptions), profile: mount(profileOptions) },
            { title: "DaData.ru", description: "DaData.ru account." },
          );
        },
        { signal },
      ),
      {
        title: "DaData.ru",
        description:
          "DaData.ru. suggestions: autocomplete and look up addresses, companies, banks, names, emails, FIAS records and locations by coordinates or IP. cleaner: standardize raw addresses, names, phones, passports, vehicles and more (paid). profile: account balance, daily usage statistics and dataset versions.",
        icons,
      },
    ),
  }),
);
