import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Regional batch hosts from docs.speechmatics.com/get-started/authentication. A job lives in the
// region of the endpoint that created it. eu2 and us2 are enterprise failover regions.
const regions = ["eu1", "eu2", "us1", "us2", "au1"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error(`Region must be one of: ${regions.join(", ")}.`);
  return `https://${region}.asr.api.speechmatics.com`;
}

const speechmatics = defineProvider({
  name: "Speechmatics",
  hosts: regions.map((region) => `${region}.asr.api.speechmatics.com`),
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/v2/jobs?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { speechmatics: speechmatics.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.speechmatics ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/v2`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Speechmatics",
        description: "Speechmatics batch speech-to-text: create and manage transcription jobs, fetch transcripts and read usage.",
        instructions:
          "The account's region (eu1, us1, au1; eu2/us2 for enterprise failover) selects the Speechmatics endpoint. A job lives in the region that created it, so use one account per region.",
        icons,
      },
    ),
  }),
);
