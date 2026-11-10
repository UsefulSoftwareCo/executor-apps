import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const PersonalInfo = object({ id: string() });

const oura = defineProvider({
  name: "Oura",
  hosts: ["api.ouraring.com"],
  auth: {
    oauth: oauth2({
      authorizationUrl: "https://cloud.ouraring.com/oauth/authorize",
      tokenUrl: "https://api.ouraring.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: " ",
      scopes: ["email", "personal", "daily", "heartrate", "workout", "tag", "session", "spo2"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ouraring.com/v2/usercollection/personal_info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, PersonalInfo);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { oura: oura.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.oura ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Oura",
        description:
          "Sleep, readiness, activity, stress, heart rate, SpO2, workouts, sessions and ring data from the Oura API.",
        icons,
      },
    ),
  }),
);
