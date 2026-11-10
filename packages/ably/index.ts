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
import { controlOptions, options } from "./openapi.js";

const ably = defineProvider({
  name: "Ably",
  hosts: ["rest.ably.io"],
  auth: {
    apiKey: secrets({
      label: "API key (the key name is the part before the colon, the secret the part after)",
      fields: object({ keyName: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  // GET /time needs no credentials, so /stats is used. Ably answers 401 for an invalid key and 403
  // for a valid key lacking the capability (e.g. publish-only keys without `stats`), so only 401 rejects.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://rest.ably.io/stats?limit=1", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.keyName}:${account.fields.secret}`)}` },
    });
    if (response.status === 401) throw new Error("Ably rejected the API key (401)");
    if (!response.ok && response.status !== 403) throw new Error(`Ably health check failed (${response.status})`);
  },
});

const control = defineProvider({
  name: "Ably Control API",
  hosts: ["control.ably.net"],
  auth: {
    accessToken: secrets({
      label: "Control API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://control.ably.net/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ably: ably.many(), control: control.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.ably ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        control: await accountRouter(
          user?.accounts.control ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...controlOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Ably",
        description:
          "Realtime messaging with Ably: publish and read channel messages, presence, push notifications and stats, plus account, app, key and integration rule management through the Control API.",
        icons,
      },
    ),
  }),
);
