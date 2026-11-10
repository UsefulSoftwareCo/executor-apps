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

const zeroCodeKit = defineProvider({
  name: "0CodeKit",
  hosts: ["prod.0codekit.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://prod.0codekit.com/user/retrievecredits", {
      method: "POST",
      signal,
      headers: { auth: account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    await decodeJson(response, object({ credits: number() }));
  },
});

export default defineApp(
  { user: { accounts: { zeroCodeKit: zeroCodeKit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zeroCodeKit ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "0CodeKit",
        description: "Utility APIs from 0CodeKit: AI, document and image processing, PDF, conversion, validation, generation, storage and scheduling.",
        icons,
      },
    ),
  }),
);
