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

const platerecognizer = defineProvider({
  name: "Plate Recognizer",
  hosts: ["api.platerecognizer.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Usage statistics for the Snapshot Cloud account: read-only and authenticated.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.platerecognizer.com/v1/statistics/", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { platerecognizer: platerecognizer.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.platerecognizer ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Plate Recognizer",
        description:
          "Read license plates and vehicles from images with Plate Recognizer: Snapshot Cloud, VIN and OCR readers, usage statistics, Vision Alert and Stream.",
        icons,
      },
    ),
  }),
);
