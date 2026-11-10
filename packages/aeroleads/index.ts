import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { assertAeroleadsBody } from "./envelope.js";
import { icons } from "./icon.js";

const aeroleads = defineProvider({
  name: "AeroLeads",
  hosts: ["aeroleads.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // AeroLeads has no free account endpoint and every lookup spends credits, so health
  // only checks that a key is present; a wrong key surfaces as an error on the first tool call.
  async health({ account }) {
    if (account.fields.token.length === 0) throw new Error("AeroLeads API key is empty");
  },
});

export default defineApp(
  { user: { accounts: { aeroleads: aeroleads.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aeroleads ?? [],
        (account) => {
          const get = async (path: string, params: Record<string, string>) => {
            const url = new URL(`https://aeroleads.com${path}`);
            for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
            url.searchParams.set("api_key", account.fields.token);
            // A non-2xx HTTP status (the docs list 401/402) rejects in decodeJson; the body envelope is checked below.
            return assertAeroleadsBody(await decodeJson(await fetch(url.toString(), { signal }), json()));
          };
          return router({
            linkedinDetails: query(
              {
                description:
                  "Look up a prospect from a LinkedIn profile URL (https://www.linkedin.com/in/...): name, job title, company, location, education, experience, skills, business emails and phone numbers. Consumes AeroLeads credits.",
                input: object({ linkedinUrl: string({ minLength: 1 }) }),
                approval: always(),
              },
              async (_ctx, { linkedinUrl }) => get("/api/get_linkedin_details", { linkedin_url: linkedinUrl }),
            ),
            verifyEmail: query(
              {
                description:
                  "Check an email address with AeroLeads: status, type, deliverability, whether it is safe to send, catch-all and disposable-domain flags. Consumes AeroLeads credits.",
                input: object({ email: string({ minLength: 1 }) }),
                approval: always(),
              },
              async (_ctx, { email }) => get("/api/get_company_email", { email }),
            ),
          });
        },
        { signal },
      ),
      {
        title: "AeroLeads",
        description:
          "AeroLeads B2B lead data: find business emails, phone numbers and profile details for a prospect from a LinkedIn URL, and verify email addresses.",
        icons,
      },
    ),
  }),
);
