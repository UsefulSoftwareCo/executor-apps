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

const docupipe = defineProvider({
  name: "DocuPipe",
  hosts: ["app.docupipe.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.docupipe.ai/account", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    // 402 means the key authenticated but the account is out of credits.
    if (response.status === 402) return;
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { docupipe: docupipe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docupipe ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DocuPipe",
        description: "Document AI with DocuPipe: upload and parse documents, extract structured data with schemas, classify, review and run workflows.",
        icons,
      },
    ),
  }),
);
