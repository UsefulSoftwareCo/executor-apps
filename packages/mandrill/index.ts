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

const mandrill = defineProvider({
  name: "Mandrill",
  hosts: ["mandrillapp.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Mandrill reads the key from the JSON body of every call, not from a header.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://mandrillapp.com/api/1.4/users/info", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: account.fields.token }),
    });
    await decodeJson(response, object({ username: string() }));
  },
});

type Fetch = typeof fetch;

// The compiled tools carry the key in the X-Mandrill-Key header (see openapi.ts). Mandrill wants it
// as the `key` field of the JSON body, so move it there before the request leaves.
const keyInBody =
  (inner: Fetch): Fetch =>
  async (input, init) => {
    const request = new Request(input, init);
    const key = request.headers.get("X-Mandrill-Key");
    if (key === null) return inner(request);
    const headers = new Headers(request.headers);
    headers.delete("X-Mandrill-Key");
    headers.set("content-type", "application/json");
    const text = await request.text();
    const body = text === "" ? {} : (JSON.parse(text) as Record<string, unknown>);
    return inner(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify({ ...body, key }),
      signal: request.signal,
    });
  };

export default defineApp(
  { user: { accounts: { mandrill: mandrill.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mandrill ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch: keyInBody(fetch), signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mandrill",
        description:
          "Send and manage transactional email and SMS with Mandrill (Mailchimp Transactional): messages, templates, senders, domains, webhooks, inbound routes and reports.",
        icons,
      },
    ),
  }),
);
