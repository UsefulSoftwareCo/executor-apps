import {
  accountRouter,
  base64,
  defineApp,
  defineProvider,
  header,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { services, type Service } from "./services.js";

const endpoint = (subdomain: string) => `https://${subdomain}.ccbchurch.com/api.php`;

// The API reports failures inside a 200 response, as <errors><error>...</error></errors>.
const failure = (xml: string) => /<errors?[\s>]/.test(xml) && /<error[\s>]/.test(xml) && !/<service_action>/.test(xml);

const chms = defineProvider({
  name: "Pushpay ChMS (v1)",
  hosts: ["*.ccbchurch.com"],
  auth: {
    // The API login created under API Admin in Pushpay ChMS (not an API User Community login).
    apiUser: secrets({
      label: "API user",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
      request: ({ username, password }) =>
        header("authorization", t`Basic ${base64(t`${username}:${password}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    // api_status does not count against the daily call limit.
    const response = await fetch(account.url(`${endpoint(account.fields.subdomain)}?srv=api_status`), {
      signal,
      headers: { ...account.headers(), Accept: "application/xml" },
    });
    const text = await response.text();
    if (!response.ok || failure(text)) throw new Error(`Pushpay ChMS rejected the credentials (${response.status}): ${text.slice(0, 500)}`);
    return {
      accountInfo: {
        externalId: account.fields.subdomain,
        displayName: `${account.fields.username}@${account.fields.subdomain}`,
      },
    };
  },
});

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function schemaFor(service: Service) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of service.params) {
    const base: Schema<unknown, boolean> = /^int/.test(type) ? number() : string();
    shape[name] = required ? base : base.optional();
  }
  if (service.xml) shape.xml = string();
  return object(shape);
}

function describe(service: Service): string {
  const lines = service.params.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  if (service.xml) lines.push("- xml (string, required): the XML document the service documents, uploaded as filedata");
  const note = service.post ? " Sent as an HTTP POST form." : "";
  return `${service.description}${note}${lines.length > 0 ? `\n\nParameters:\n${lines.join("\n")}` : ""}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (service: Service, input: Record<string, unknown>) => {
    const params = new URLSearchParams();
    for (const [name] of service.params) {
      const value = input[name];
      if (value !== undefined && value !== null) params.set(name, String(value));
    }
    const url = new URL(endpoint(account.fields.subdomain));
    url.searchParams.set("srv", service.name);
    let init: RequestInit;
    if (service.xml) {
      for (const [key, value] of params) url.searchParams.set(key, value);
      const form = new FormData();
      form.set("filedata", new Blob([String(input.xml)], { type: "text/xml" }), `${service.name}.xml`);
      init = { method: "POST", body: form };
    } else if (service.post) {
      init = { method: "POST", body: params, headers: { "content-type": "application/x-www-form-urlencoded" } };
    } else {
      for (const [key, value] of params) url.searchParams.set(key, value);
      init = { method: "GET" };
    }
    const response = await fetcher(account.url(url.toString()), {
      ...init,
      signal,
      headers: { ...account.headers(), Accept: "application/xml", ...(init.headers as Record<string, string> | undefined) },
    });
    const xml = await response.text();
    if (!response.ok || failure(xml)) throw new Error(`Pushpay ChMS answered ${response.status}: ${xml.slice(0, 1000)}`);
    return { xml };
  };

  const tools: Record<string, unknown> = {};
  for (const service of services) {
    const options = { description: describe(service), input: schemaFor(service) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(service, input);
    tools[service.name] = service.kind === "query" ? query(options, handler as never) : mutation(options, handler as never);
  }
  return router(tools as never);
}

export default defineApp(
  { user: { accounts: { pushpayChmsV1: chms.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pushpayChmsV1 ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pushpay ChMS (v1)",
        description:
          "Pushpay ChMS v1 (Church Community Builder): individuals, families, groups, events, attendance, gifts and transactions, forms, saved searches and lookup tables.",
        instructions:
          "Every tool is one documented api.php service and returns the raw XML response as { xml }. Services are rate limited (60 request burst, 1 per second, plus a daily quota) and the credentials only reach the services the API user was granted. Use the *_list tools to find IDs, then *_detail or *_profile tools. XML-upload tools (import_batches, import_online_gifts, create_event_attendance) take the document in xml.",
        icons,
      },
    ),
  }),
);
