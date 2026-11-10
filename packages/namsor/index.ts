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

// The spec declares these account-setting operations (tag "admin") as GET, so kind alone misses
// them: disable (deactivates an API key), genderstatv3, learnable and anonymize.
const accountSettingTool = /(^|\.)(disable|genderstatv3|learnable|anonymize)\d*$/;

const namsor = defineProvider({
  name: "NamSor",
  hosts: ["v2.namsor.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://v2.namsor.com/NamSorAPIv2/api2/json/apiUsage", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { namsor: namsor.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.namsor ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || accountSettingTool.test(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "NamSor",
        description:
          "Classify personal names: gender, cultural origin, country, diaspora, US race/ethnicity, religion, caste, and name parsing.",
        icons,
      },
    ),
  }),
);
