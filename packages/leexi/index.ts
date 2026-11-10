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

function utf8Base64(value: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const leexi = defineProvider({
  name: "Leexi",
  hosts: ["public-api.leexi.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ keyId: string({ minLength: 1 }), keySecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://public-api.leexi.ai/v1/users", {
      signal,
      headers: { Authorization: `Basic ${utf8Base64(`${account.fields.keyId}:${account.fields.keySecret}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { leexi: leexi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leexi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Leexi",
        description: "Leexi AI notetaker: calls and recordings, call notes, meeting events, users and teams.",
        icons,
      },
    ),
  }),
);
