import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.campaigncleaner.com/v1";

// The apps runtime rejects redirect: "error", so use "manual" and treat any 3xx as a failure.
// The API key never follows a redirect to another host.
const send = async (fetch: typeof globalThis.fetch, url: string, init: RequestInit): Promise<Response> => {
  const response = await fetch(url, { ...init, redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Campaign Cleaner returned an unexpected redirect (${response.status})`);
  }
  return response;
};

const campaigncleaner = defineProvider({
  name: "Campaign Cleaner",
  hosts: ["api.campaigncleaner.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // get_credits is read-only and proves the key is valid.
  async health({ account, fetch, signal }) {
    const response = await send(fetch, `${base}/get_credits`, {
      signal,
      headers: { "X-CC-API-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Campaign Cleaner rejected the API key (${response.status})`);
    await decodeJson(response, object({ credits: number() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "X-CC-API-Key": account.fields.token,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const campaignCleanerTools = (account: Account, signal: AbortSignal) => {
  const post = (fetch: typeof globalThis.fetch, path: string, body: unknown) =>
    send(fetch, `${base}/${path}`, { method: "POST", signal, headers: headers(account), body: JSON.stringify(body) });

  return router({
    getCredits: query(
      {
        description: "Get the number of API credits left on the account. send_campaign and create_inbox_test consume credits.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await send(fetch, `${base}/get_credits`, { signal, headers: headers(account) }), json()),
    ),
    getCampaignList: query(
      {
        description:
          "List the saved campaigns with id, campaign_name, status (processing, completed or paused) and date_added.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await send(fetch, `${base}/get_campaign_list`, { signal, headers: headers(account) }), json()),
    ),
    getCampaignStatus: query(
      {
        description:
          "Get the processing status of one campaign (processing, completed or paused). Processing takes up to a minute or two; call get_campaign once the status is completed.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(await post(fetch, "get_campaign_status", { campaign: { id } }), json()),
    ),
    getCampaign: query(
      {
        description:
          "Retrieve a processed campaign: the cleaned HTML, the settings applied and the full analysis (spam triggers, links, images, capitalization and punctuation ratios and more). minimizeHtml (default true) strips whitespace from the returned HTML.",
        input: object({ id: string(), minimizeHtml: boolean().optional() }),
      },
      async ({ fetch }, { id, minimizeHtml }) =>
        decodeJson(
          await post(fetch, "get_campaign", {
            campaign: { id, ...(minimizeHtml === undefined ? {} : { minimize_html: minimizeHtml }) },
          }),
          json(),
        ),
    ),
    getCampaignPdfAnalysis: query(
      {
        description:
          "Download the PDF analysis report of a processed campaign. Returns content_type and the PDF bytes as content_base64.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) => {
        const response = await post(fetch, "get_campaign_pdf_analysis", { campaign: { id } });
        if (!response.ok) throw new Error(`Campaign Cleaner returned ${response.status}: ${await response.text()}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return { content_type: response.headers.get("content-type") ?? "application/pdf", content_base64: btoa(binary) };
      },
    ),
    getInboxTestResults: query(
      {
        description:
          "Get placement results of an inbox test created with create_inbox_test: status (Processing or Completed), a summary of inbox, spam and pending seeds, and per-provider results. Poll until Completed.",
        input: object({ jobId: string() }),
      },
      async ({ fetch }, { jobId }) =>
        decodeJson(await post(fetch, "get_inbox_test_results", { job_id: jobId }), json()),
    ),
    sendCampaign: mutation(
      {
        description:
          "Submit an HTML campaign for cleaning and analysis; consumes one credit. Returns the campaign id: poll get_campaign_status, then call get_campaign. Optional settings default to Campaign Cleaner's defaults; the vendor documents conflicting defaults for removeControlNonPrintable, removeImageHeight, removeSuccessivePunctuation and resizeAndHost, so set those explicitly. webhookUrl must be absolute without a query string. customInfo is up to 500 characters and is returned by get_campaign.",
        input: object({
          campaignHtml: string(),
          campaignName: string(),
          adjustFontColors: boolean().optional(),
          adjustFontSize: boolean().optional(),
          minFontSizeAllowed: number().optional(),
          maxFontSizeAllowed: number().optional(),
          convertHToPTags: boolean().optional(),
          convertTablesToDivs: boolean().optional(),
          customInfo: string().optional(),
          hostExtensionlessImages: boolean().optional(),
          inlineCss: boolean().optional(),
          inlineCssImportant: boolean().optional(),
          mediaQueriesImportant: boolean().optional(),
          preserveMediaQueries: boolean().optional(),
          imageMaxWidth: number().optional(),
          removeClassesAndIds: boolean().optional(),
          removeComments: boolean().optional(),
          removeControlNonPrintable: boolean().optional(),
          removeCssInheritance: boolean().optional(),
          removeImageHeight: boolean().optional(),
          removeLargeWidthsOver: number().optional(),
          removeSuccessivePunctuation: boolean().optional(),
          relativeLinksBaseUrl: string().optional(),
          replaceDiacritics: boolean().optional(),
          replaceNonAsciiCharacters: boolean().optional(),
          resizeAndHost: boolean().optional(),
          webhookUrl: string().optional(),
          surroundingDiv: object({
            maxWidth: number().optional(),
            textAlign: string().optional(),
            fontSize: number().optional(),
            centerToParent: boolean().optional(),
          }).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const { surroundingDiv, ...rest } = input;
        const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value === undefined) continue;
          out[key === "convertHToPTags" ? "convert_h_to_p_tags" : snake(key)] = value;
        }
        if (surroundingDiv !== undefined) {
          out.surrounding_div = Object.fromEntries(
            Object.entries(surroundingDiv)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [snake(k), v]),
          );
        }
        return decodeJson(await post(fetch, "send_campaign", { send_campaign: out }), json());
      },
    ),
    createInboxTest: mutation(
      {
        description:
          "Create an inbox placement test (one credit; needs a Campaign Cleaner or Inbox Placement Tester subscription). Returns job_id and the send_to seed addresses; send your campaign to every address, then call get_inbox_test_results. testName is at most 255 characters.",
        input: object({ testName: string() }),
        approval: always(),
      },
      async ({ fetch }, { testName }) =>
        decodeJson(await post(fetch, "create_inbox_test", { test_name: testName }), json()),
    ),
    deleteCampaign: mutation(
      {
        description: "Permanently delete a saved campaign by id. Returns status success or failure.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => decodeJson(await post(fetch, "delete_campaign", { campaign: { id } }), json()),
    ),
  });
};

export default defineApp({ user: { accounts: { campaigncleaner: campaigncleaner.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.campaigncleaner ?? [], (account) => campaignCleanerTools(account, signal), { signal }),
    {
      title: "Campaign Cleaner",
      description:
        "Clean, inline and analyze HTML email campaigns: submit campaigns, read results and PDF reports, manage saved campaigns, check credits and run inbox placement tests.",
      icons,
    },
  ),
}));
