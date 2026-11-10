import {
  accountRouter,
  array,
  boolean,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://app.passcreator.com";

const passcreator = defineProvider({
  name: "Passcreator",
  hosts: ["app.passcreator.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing validation app configurations is read-only and works with any valid key (401 otherwise).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/appconfiguration`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Passcreator rejected the API key (${response.status})`);
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof globalThis.fetch;

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const seg = encodeURIComponent;

// Passcreator sends the raw API key in Authorization, with no Bearer prefix. Many calls answer
// 204 or 202 with an empty body, so the status is returned when there is nothing to decode.
const call = async (
  fetch: Fetch,
  account: Account,
  signal: AbortSignal,
  method: string,
  path: string,
  body?: unknown,
) => {
  const response = await fetch(`${origin}${path}`, {
    method,
    signal,
    headers: {
      Authorization: account.fields.token,
      Accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Passcreator ${method} ${path} failed (${response.status}): ${text.slice(0, 1000)}`);
  if (text === "") return { status: response.status };
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { status: response.status, body: text };
  }
};

const passTools = (account: Account, signal: AbortSignal) => {
  const get = (fetch: Fetch, path: string) => call(fetch, account, signal, "GET", path);
  const send = (fetch: Fetch, method: string, path: string, body?: unknown) =>
    call(fetch, account, signal, method, path, body);
  const uid = string({ minLength: 1 });
  return router({
    passes: router({
      list: query(
        {
          description:
            "List or search passes with the v3 API. Without a filter every pass is returned, newest pages first via page.next. Filter with segmentId or a base64 URL-safe encoded Passcreator query (query). pageSize defaults to 100. fields is a comma-separated list of pass fields to return. formatKeyAdditionalProperties is id or name.",
          input: object({
            pageSize: number().optional(),
            segmentId: string().optional(),
            query: string().optional(),
            fields: string().optional(),
            formatKeyAdditionalProperties: string().optional(),
          }),
        },
        async ({ fetch }, input) => get(fetch, `/api/v3/pass${qs(input)}`),
      ),
      listByTemplate: query(
        {
          description:
            "List the passes of one pass template (v1 API), 100 per page at most. Page with start, or with lastIdOfPriorPage and lastCreatedOnOfPriorPage (recommended). createdSince and modifiedSince use the format Y-m-d H:i.",
          input: object({
            templateId: uid,
            start: number().optional(),
            pageSize: number().optional(),
            lastIdOfPriorPage: string().optional(),
            lastCreatedOnOfPriorPage: string().optional(),
            createdSince: string().optional(),
            modifiedSince: string().optional(),
          }),
        },
        async ({ fetch }, { templateId, ...input }) => get(fetch, `/api/pass/list/${seg(templateId)}${qs(input)}`),
      ),
      read: query(
        {
          description:
            "Read one pass (v1). passId accepts the pass identifier, a userProvidedId or a barcode value. includeFieldMapping adds the field mapping; appConfigurationId checks eligibility at that validation location.",
          input: object({
            passId: uid,
            includeFieldMapping: boolean().optional(),
            appConfigurationId: string().optional(),
          }),
        },
        async ({ fetch }, { passId, ...input }) => get(fetch, `/api/pass/${seg(passId)}${qs(input)}`),
      ),
      getUris: query(
        {
          description: "Get the wallet download links of a pass: iPhoneUri (.pkpass file) and AndroidUri (Google Wallet save link or PassWallet link).",
          input: object({ passId: uid }),
        },
        async ({ fetch }, { passId }) => get(fetch, `/api/pass/geturis/${seg(passId)}`),
      ),
      search: query(
        {
          description: "Search the passes of one template by content (name, id, barcode and so on). Fuzzy and partial matches can appear. Returns an array of passes.",
          input: object({ templateId: uid, searchString: uid }),
        },
        async ({ fetch }, { templateId, searchString }) =>
          get(fetch, `/api/pass/search/${seg(templateId)}/${seg(searchString)}`),
      ),
      create: mutation(
        {
          description:
            "Create a pass (v3). data must contain templateId plus any of userProvidedId, enforceUniqueUserProvidedId, barcodeValue, groupingIdentifier, urlToThumbnail, urlToBackground, urlToLogo, expirationDate and relevantDate (Y-m-d H:i), labelColor, foregroundColor, backgroundColor (hex), emailRecipient, phoneRecipient, locations, storedValue, eligibleValidationPlaces, downloadPin, bundleId, and the template's own field names or ids. Set async false to get the real barcodeValue back. Returns identifier, downloadPage, iPhoneUri and androidUri.",
          input: object({ data: record(json()), async: boolean().optional() }),
          approval: always(),
        },
        async ({ fetch }, { data, async }) => send(fetch, "POST", `/api/v3/pass${qs({ async })}`, { data }),
      ),
      update: mutation(
        {
          description:
            "Partially update a pass (v3 PATCH): only the fields in data change. Takes the same fields as create except templateId, plus placesUsedAt to clear recorded validation usages (\"\", [] or null clears all, an array of place names clears those).",
          input: object({ passId: uid, data: record(json()), async: boolean().optional() }),
          approval: always(),
        },
        async ({ fetch }, { passId, data, async }) =>
          send(fetch, "PATCH", `/api/v3/pass/${seg(passId)}${qs({ async })}`, { data }),
      ),
      replace: mutation(
        {
          description: "Replace a pass (v3 POST): every field omitted from data is deleted from the pass. Use update to change only some fields.",
          input: object({ passId: uid, data: record(json()), async: boolean().optional() }),
          approval: always(),
        },
        async ({ fetch }, { passId, data, async }) =>
          send(fetch, "POST", `/api/v3/pass/${seg(passId)}${qs({ async })}`, { data }),
      ),
      bulkUpdate: mutation(
        {
          description:
            "Update many passes at once (v3 PATCH, asynchronous, answers 202 with a progress URL). filter takes one of identifiers (array of pass ids), segmentId, or query ({ templateId, groups }). data takes the update fields; a data with only pushNotificationText sends a push notification to the matching passes without changing them.",
          input: object({ data: record(json()), filter: record(json()) }),
          approval: always(),
        },
        async ({ fetch }, { data, filter }) => send(fetch, "PATCH", "/api/v3/pass/bulk", { data, filter }),
      ),
      delete: mutation(
        {
          description: "Permanently delete a pass (v3). passId is the pass identifier.",
          input: object({ passId: uid }),
          approval: always(),
        },
        async ({ fetch }, { passId }) => send(fetch, "DELETE", `/api/v3/pass/${seg(passId)}`),
      ),
      setVoided: mutation(
        {
          description: "Void or un-void a pass (v1). passId accepts the identifier, a userProvidedId or a barcode value.",
          input: object({ passId: uid, voided: boolean() }),
          approval: always(),
        },
        async ({ fetch }, { passId, voided }) => send(fetch, "PUT", `/api/pass/${seg(passId)}`, { voided }),
      ),
      enableDownload: mutation(
        {
          description: "Allow a pass to be downloaded until a given time (v1). enableDownloadUntil uses Y-m-d H:i and defaults to 10 minutes from now.",
          input: object({ passId: uid, enableDownloadUntil: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, { passId, enableDownloadUntil }) =>
          send(fetch, "POST", `/api/pass/${seg(passId)}/enabledownload`, enableDownloadUntil === undefined ? {} : { enableDownloadUntil }),
      ),
      sendPushNotification: mutation(
        {
          description:
            "Send a push notification to one pass (v1). pushNotificationText supports placeholders like {Firstname}. Fails with 400 if the pass has no active registration, and 304 when the same text was already sent.",
          input: object({ passId: uid, pushNotificationText: uid }),
          approval: always(),
        },
        async ({ fetch }, { passId, pushNotificationText }) =>
          send(fetch, "POST", `/api/pass/${seg(passId)}/sendpushnotification`, { pushNotificationText }),
      ),
      sendPushNotifications: mutation(
        {
          description: "Send a push notification to up to 500 passes (v1, asynchronous). listOfPasses holds identifiers, userProvidedIds or barcode values; unknown ones are skipped.",
          input: object({ listOfPasses: array(string()), pushNotificationText: uid }),
          approval: always(),
        },
        async ({ fetch }, input) => send(fetch, "POST", "/api/pass/sendpushnotifications", input),
      ),
      sendByEmail: mutation(
        {
          description: "Email a pass to a recipient (v1). The pass template must have an ad hoc email template configured.",
          input: object({ passId: uid, recipientEmail: uid }),
          approval: always(),
        },
        async ({ fetch }, { passId, recipientEmail }) =>
          send(fetch, "POST", `/api/pass/deliver/${seg(passId)}/email/${seg(recipientEmail)}`),
      ),
      statistics: query(
        {
          description:
            "Usage statistics of a template: timelines of active and inactive registrations, created and updated passes, and push notifications, plus passes per operating system. timeFrame is day, week, month or year (year only under 10,000 passes); day is today or Y-m-d.",
          input: object({ templateId: uid, timeFrame: string(), day: string() }),
        },
        async ({ fetch }, { templateId, ...input }) => get(fetch, `/api/pass/statistics/${seg(templateId)}${qs(input)}`),
      ),
      activeHistory: query(
        {
          description: "Daily active and inactive pass counts of a template since startingDay (Y-m-d); the last 7 days when omitted.",
          input: object({ templateId: uid, startingDay: string().optional() }),
        },
        async ({ fetch }, { templateId, startingDay }) =>
          get(
            fetch,
            `/api/pass/statistics/${seg(templateId)}/activehistory${startingDay === undefined ? "" : `/${seg(startingDay)}`}`,
          ),
      ),
    }),
    templates: router({
      list: query(
        { description: "List the pass templates the API key's user can access.", input: object({}) },
        async ({ fetch }) => get(fetch, "/api/pass-template"),
      ),
      describe: query(
        {
          description: "Get the full definition of a pass template (v2): fields, barcode, images, colors, additional properties, wallet apps and more.",
          input: object({ templateId: uid }),
        },
        async ({ fetch }, { templateId }) => get(fetch, `/api/v2/pass-template/${seg(templateId)}/describe`),
      ),
      create: mutation(
        {
          description:
            "Create a pass template (v2). template is the full template JSON: required name, description, organizationName, type (coupon, storeCard, eventTicketBackground, eventTicket, generic, boardingPass), passTypeId, fields, barcode, images (icon required) and colors (labelColor, foregroundColor, backgroundColor). Use describe on an existing template as a model. Returns the new template identifier.",
          input: object({ template: record(json()) }),
          approval: always(),
        },
        async ({ fetch }, { template }) => send(fetch, "POST", "/api/v2/pass-template", template),
      ),
    }),
    validation: router({
      listAppConfigurations: query(
        { description: "List the validation app configurations (scan setups) of the account.", input: object({}) },
        async ({ fetch }) => get(fetch, "/api/appconfiguration"),
      ),
      getAppConfiguration: query(
        { description: "Get one validation app configuration, including its valid validation places and links.", input: object({ configurationId: uid }) },
        async ({ fetch }, { configurationId }) => get(fetch, `/api/appconfiguration/${seg(configurationId)}`),
      ),
      createAppConfiguration: mutation(
        {
          description:
            "Create a validation app configuration. configuration needs name and scanMode (0 voids the pass after a scan, 1 records attendance only); optional passTemplateId (all templates when empty), type (0 app, 1 URL), place, backgroundColor, textColor, additionalProperties ([{ name, type: unicode|double|boolean }]), showStoredValue, incrementStoredValue, preventNegativeNumericValues, preventNegativeStoredValueBalance.",
          input: object({ configuration: record(json()) }),
          approval: always(),
        },
        async ({ fetch }, { configuration }) => send(fetch, "POST", "/api/appconfiguration", configuration),
      ),
      listScans: query(
        {
          description:
            "List recorded pass scans, sorted by creation date. appConfigurationId limits them to one configuration. scanStatus: 0 voided by this scan, 1 already voided, 2 attendance saved, 3 pass not found. createdSince uses Y-m-d H:i.",
          input: object({
            appConfigurationId: string().optional(),
            start: number().optional(),
            pageSize: number().optional(),
            createdSince: string().optional(),
          }),
        },
        async ({ fetch }, { appConfigurationId, ...input }) =>
          get(fetch, `/api/appscan/list${appConfigurationId === undefined ? "" : `/${seg(appConfigurationId)}`}${qs(input)}`),
      ),
      createScan: mutation(
        {
          description:
            "Record a pass scan (validate a pass). scan needs appConfigurationId, scanStatus (0-3), passId (null if no pass matched), scannedBarcodeValue, deviceName and createdOn (Y-m-d H:i:s); optional setVoided and additionalProperties (property id to value).",
          input: object({ scan: record(json()) }),
          approval: always(),
        },
        async ({ fetch }, { scan }) => send(fetch, "POST", "/api/appscan", scan),
      ),
    }),
  });
};

export default defineApp({ user: { accounts: { passcreator: passcreator.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.passcreator ?? [], (account) => passTools(account, signal), { signal }), {
    title: "Passcreator",
    description:
      "Create, update, void and deliver Apple Wallet and Google Wallet passes with Passcreator: passes, templates, push notifications, statistics and pass validation scans.",
    icons,
  }),
}));
