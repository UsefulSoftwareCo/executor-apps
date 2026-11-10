import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const gettyimages = defineProvider({
  name: "Getty Images",
  hosts: ["api.gettyimages.com"],
  auth: {
    // Search, metadata and affiliate endpoints. Key from https://developers.gettyimages.com/ > My Apps.
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Downloads, boards, orders and AI generation need an OAuth access token issued for the same API key.
    accessToken: secrets({
      label: "API key and OAuth access token",
      fields: object({ apiKey: string({ minLength: 1 }), accessToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gettyimages.com/v3/countries", {
      signal,
      headers: { "Api-Key": account.fields.apiKey, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return {};
  },
});

export default defineApp(
  { user: { accounts: { gettyimages: gettyimages.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gettyimages ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Getty Images",
        description:
          "Search creative and editorial images and video, read metadata, manage boards, download licensed assets and generate AI images with the Getty Images API.",
        instructions:
          "Search and metadata work with an API key alone. Downloads, boards, orders, purchased assets and AI generation need the API key plus an OAuth access token.",
        icons,
      },
    ),
  }),
);
