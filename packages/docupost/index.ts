import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.docupost.com/api/1.1/wf";

const docupost = defineProvider({
  name: "DocuPost",
  hosts: ["app.docupost.com"],
  auth: {
    // Generated under account settings > Developer > Generate API Token. Sent as the api_token query parameter.
    // Documented exception to the "provider health check" rule: DocuPost's docs list only sendletter and
    // sendpostcard, both of which mail paid items. There is no documented read-only endpoint, and the
    // undocumented accountbalance endpoint is deliberately not used. So no health check.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

const address = {
  to_name: string({ minLength: 1 }), // max 40 characters
  to_company: string().optional(),
  to_address1: string({ minLength: 1 }),
  to_address2: string().optional(),
  to_city: string({ minLength: 1 }),
  to_state: string({ minLength: 2 }),
  to_zip: string({ minLength: 5 }), // 5-digit ZIP, checked at call time
  from_name: string({ minLength: 1 }),
  from_address1: string({ minLength: 1 }),
  from_address2: string().optional(),
  from_city: string({ minLength: 1 }),
  from_state: string({ minLength: 2 }),
  from_zip: string({ minLength: 5 }),
  description: string().optional(),
};

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Limits from the vendor docs. The schema builder has no maxLength/pattern, so they are enforced here,
// before the paid call. Names/description: docs table says "Max 40 characters" while the FAQ says "less
// than 40"; 40 is used.
const maxLengths: Record<string, number> = {
  to_name: 40,
  to_company: 40,
  from_name: 40,
  description: 40,
  html: 9000,
};

function validate(args: Params) {
  for (const [key, max] of Object.entries(maxLengths)) {
    const value = args[key];
    if (typeof value === "string" && value.length > max) {
      throw new Error(`DocuPost: ${key} is ${value.length} characters; the maximum is ${max}`);
    }
  }
  for (const key of ["to_zip", "from_zip"]) {
    const value = args[key];
    if (typeof value === "string" && !/^\d{5}$/.test(value)) {
      throw new Error(`DocuPost: ${key} must be a 5-digit ZIP code`);
    }
  }
}

async function send(
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  token: string,
  path: string,
  params: Params,
  body: Params | undefined,
) {
  const target = new URL(`${base}/${path}`);
  target.searchParams.set("api_token", token);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    target.searchParams.set(key, String(value));
  }
  const response = await fetcher(target.toString(), {
    method: "POST",
    signal,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`DocuPost ${path} failed with ${response.status}: ${text}`);
  try {
    return await decodeJson(new Response(text), json());
  } catch {
    return { status: response.status, body: text };
  }
}

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    sendLetter: mutation(
      {
        description:
          "Print and mail a letter through the USPS. Provide pdf (public URL, max 10MB, 8.5x11 recommended) or html (max 9000 chars; sent as a JSON body {\"html\": ...}, a shape the vendor docs do not confirm). Limits: to_name, to_company, from_name and description max 40 characters; ZIP codes are 5 digits. Class defaults to usps_first_class; servicelevel (certified, certified_return_receipt) needs usps_first_class. Costs account balance; test letters can be cancelled in the dashboard within an hour.",
        input: object({
          ...address,
          pdf: string().optional(),
          html: string().optional(),
          color: boolean().optional(),
          doublesided: boolean().optional(),
          class: string().optional(),
          servicelevel: string().optional(),
          return_envelope: boolean().optional(),
        }),
      },
      async (_ctx, args) => {
        // Vendor docs: pdf is "Required unless html is sent via request body". Fail before the paid call.
        if (args.pdf === undefined && args.html === undefined) {
          throw new Error("DocuPost sendLetter requires either pdf (URL) or html");
        }
        validate(args);
        const { html, ...params } = args;
        return send(fetcher, signal, token, "sendletter", params, html === undefined ? undefined : { html });
      },
    ),
    sendPostcard: mutation(
      {
        description:
          "Print and mail a postcard through the USPS. front_image and back_image are public image URLs, 1875x1275 px (PNG recommended); wrong dimensions fail the mailing even when the request succeeds. size is 4x6 (default) or 6x9. Limits: to_name, to_company, from_name and description max 40 characters; ZIP codes are 5 digits. Costs account balance.",
        input: object({
          ...address,
          front_image: string({ minLength: 1 }),
          back_image: string({ minLength: 1 }),
          size: string().optional(),
        }),
      },
      async (_ctx, args) => {
        validate(args);
        return send(fetcher, signal, token, "sendpostcard", args, undefined);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { docupost: docupost.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docupost ?? [],
        (account) =>
          withApprovals(tools(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DocuPost",
        description: "Print and mail letters (PDF or HTML) and postcards through the USPS with DocuPost.",
        icons,
      },
    ),
  }),
);
