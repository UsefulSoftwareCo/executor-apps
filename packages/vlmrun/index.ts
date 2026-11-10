import {
  accountRouter,
  array,
  json,
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
import { gatewayOptions, options } from "./openapi.js";

const vlmrun = defineProvider({
  name: "VLM Run",
  hosts: ["api.vlm.run", "gateway.vlm.run"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.vlm.run/v1/models", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(json()));
  },
});

export default defineApp(
  { user: { accounts: { vlmrun: vlmrun.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vlmrun ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              api: approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account })),
              gateway: approve(liveOpenapiRouter({ ...gatewayOptions, cache, fetch, signal, account })),
            },
            { title: "VLM Run", description: "VLM Run account." },
          );
        },
        { signal },
      ),
      {
        title: "VLM Run",
        description:
          "Visual AI for documents, images, video and audio: structured extraction, agents, predictions, files and skills. api: main API (api.vlm.run). gateway: gateway API (embeddings, audio transcription, model and completion lookup, typesafe endpoints).",
        icons,
      },
    ),
  }),
);
