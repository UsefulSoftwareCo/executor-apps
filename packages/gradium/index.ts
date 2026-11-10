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
import { options } from "./openapi.js";

const gradium = defineProvider({
  name: "Gradium",
  hosts: ["api.gradium.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gradium.ai/api/usages/credits", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(
      response,
      object({ remaining_credits: number(), allocated_credits: number(), billing_period: string() }),
    );
  },
});

export default defineApp(
  { user: { accounts: { gradium: gradium.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gradium ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gradium",
        description: "Gradium voice AI: one-shot text-to-speech and transcription, voices, voice design, enhancement, localization and pronunciations.",
        icons,
      },
    ),
  }),
);
