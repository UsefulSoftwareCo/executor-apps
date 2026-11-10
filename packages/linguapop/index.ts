import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.linguapop.eu/api/actions";

const linguapop = defineProvider({
  name: "Linguapop",
  hosts: ["app.linguapop.eu"],
  auth: {
    apiKey: secrets({
      label: "Integration API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The only read-only endpoint (getLanguages) takes no key, and sendInvitation creates data, so the key
  // cannot be verified without side effects. This checks that the API is reachable.
  async health({ fetch, signal }) {
    const response = await fetch(`${base}/getLanguages`, { signal });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function build(apiKey: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    getLanguages: query(
      {
        description:
          "List the languages Linguapop can test, each with a name and a code (eng, ita, spa, ger, fra). Use the code as languageCode in sendInvitation.",
        input: object({}),
      },
      async () => decodeJson(await fetcher(`${base}/getLanguages`, { signal }), json()),
    ),
    sendInvitation: mutation(
      {
        description:
          "Create a placement test invitation for a candidate, optionally emailing it. Returns invitationId, the direct test url, emailSent and kioskCode (null unless generateKioskCode). Results are not retrievable by API: pass callbackUrl to receive a POST with the results when the test is completed.",
        input: object({
          email: string({ minLength: 1 }),
          languageCode: string({ minLength: 1 }),
          sendEmail: boolean(),
          name: string().optional(),
          externalIdentifier: string().optional(),
          generateKioskCode: boolean().optional(),
          testReading: boolean().optional(),
          testListening: boolean().optional(),
          callbackUrl: string().optional(),
          returnUrl: string().optional(),
        }),
      },
      async (_ctx, input) =>
        decodeJson(
          await fetcher(`${base}/sendInvitation`, {
            method: "POST",
            signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, apiKey }),
          }),
          json(),
        ),
    ),
  });
}

export default defineApp(
  { user: { accounts: { linguapop: linguapop.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.linguapop ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Linguapop",
        description: "Create and send Linguapop language placement test invitations and list supported test languages.",
        icons,
      },
    ),
  }),
);
