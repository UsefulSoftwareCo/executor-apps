import {
  accountRouter,
  array,
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

const docugenerate = defineProvider({
  name: "DocuGenerate",
  hosts: ["api.docugenerate.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.docugenerate.com/v1/template", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, array(object({ id: string() })));
  },
});

export default defineApp(
  { user: { accounts: { docugenerate: docugenerate.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docugenerate ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DocuGenerate",
        description: "Generate PDF and Word documents from templates and JSON data with DocuGenerate: manage templates and documents.",
        icons,
      },
    ),
  }),
);
