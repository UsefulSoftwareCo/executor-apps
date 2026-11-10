import {
  accountRouter,
  array,
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

const base = "https://control.msg91.com/api/v5";

const msg91 = defineProvider({
  name: "MSG91",
  hosts: ["control.msg91.com", "api.msg91.com"],
  auth: {
    apiKey: secrets({
      label: "Authkey",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // SMS analytics is a free read-only call that MSG91 rejects with 401 for a bad authkey.
  async health({ account, fetch, signal }) {
    const date = new Date().toISOString().slice(0, 10);
    const response = await fetch(`${base}/report/analytics/p/sms?startDate=${date}&endDate=${date}`, {
      signal,
      headers: { authkey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const result = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      result.searchParams.set(key, String(value));
    }
    return result.toString();
  };
  const send = async (method: "GET" | "POST", path: string, params: Params, body?: unknown) =>
    decodeJson(
      await fetcher(url(path, params), {
        method,
        signal,
        headers: { authkey: token, accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );
  return {
    get: (path: string, params: Params = {}) => send("GET", path, params),
    post: (path: string, params: Params = {}, body?: unknown) => send("POST", path, params, body),
  };
}

type Client = ReturnType<typeof client>;

const dateRange = {
  startDate: string({ minLength: 10 }),
  endDate: string({ minLength: 10 }),
};

const logOptions = {
  ...dateRange,
  limit: number().optional(),
  fields: string().optional(),
};

const tools = (c: Client) =>
  router({
    sms: router(
      {
        send: mutation(
          {
            description:
              "Send an SMS through a DLT-approved flow template. recipients is an array of objects with a mobiles number (country code, no +) plus a value for each template variable (VAR1, VAR2...). Set shortUrl to shorten links.",
            input: object({
              templateId: string({ minLength: 1 }),
              recipients: array(json()),
              shortUrl: string().optional(),
              shortUrlExpiry: string().optional(),
              realTimeResponse: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post("/flow", {}, {
              template_id: i.templateId,
              recipients: i.recipients,
              short_url: i.shortUrl,
              short_url_expiry: i.shortUrlExpiry,
              realTimeResponse: i.realTimeResponse,
            }),
        ),
        logs: query(
          {
            description:
              "SMS delivery logs between two dates (yyyy-mm-dd). fields is a comma-separated list such as status,telNum,requestId,failureReason; limit defaults to 1000.",
            input: object(logOptions),
          },
          async (_ctx, i) => c.post("/report/logs/p/sms", i),
        ),
        analytics: query(
          {
            description: "SMS delivery analytics between two dates (yyyy-mm-dd). The range may span at most 31 days.",
            input: object(dateRange),
          },
          async (_ctx, i) => c.get("/report/analytics/p/sms", i),
        ),
      },
      { title: "SMS", description: "Send template-based SMS and read delivery logs and analytics." },
    ),
    otp: router(
      {
        send: mutation(
          {
            description:
              "Send an OTP by SMS using an OTP template. mobile includes the country code. Optionally set otpLength (4-9), otpExpiry in minutes, or supply your own otp. Extra template variables go in variables.",
            input: object({
              templateId: string({ minLength: 1 }),
              mobile: string({ minLength: 1 }),
              otp: string().optional(),
              otpLength: number().optional(),
              otpExpiry: number().optional(),
              unicode: number().optional(),
              realTimeResponse: number().optional(),
              variables: json().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post(
              "/otp",
              {
                template_id: i.templateId,
                mobile: i.mobile,
                otp: i.otp,
                otp_length: i.otpLength,
                otp_expiry: i.otpExpiry,
                unicode: i.unicode,
                realTimeResponse: i.realTimeResponse,
              },
              i.variables ?? {},
            ),
        ),
        verify: query(
          {
            description: "Verify an OTP a user entered. A wrong or expired OTP returns type \"error\" with HTTP 200.",
            input: object({ mobile: string({ minLength: 1 }), otp: string({ minLength: 1 }) }),
          },
          async (_ctx, i) => c.get("/otp/verify", i),
        ),
        resend: mutation(
          {
            description: "Resend an OTP by voice (retryType \"voice\", the default) or text (retryType \"text\").",
            input: object({ mobile: string({ minLength: 1 }), retryType: string().optional() }),
            approval: always(),
          },
          async (_ctx, i) => c.get("/otp/retry", { mobile: i.mobile, retrytype: i.retryType ?? "voice" }),
        ),
        logs: query(
          {
            description: "OTP delivery logs between two dates (yyyy-mm-dd).",
            input: object(logOptions),
          },
          async (_ctx, i) => c.post("/report/logs/p/otp", i),
        ),
      },
      { title: "OTP", description: "Send, verify and resend one-time passwords." },
    ),
    email: router(
      {
        send: mutation(
          {
            description:
              "Send an email through a MSG91 email template. recipients is an array of {to: [{name, email}], cc?, bcc?, variables?}; from is {name, email}; domain is a verified sending domain.",
            input: object({
              templateId: string({ minLength: 1 }),
              domain: string({ minLength: 1 }),
              from: json(),
              recipients: array(json()),
              replyTo: json().optional(),
              attachments: array(json()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post("/email/send", {}, {
              template_id: i.templateId,
              domain: i.domain,
              from: i.from,
              recipients: i.recipients,
              reply_to: i.replyTo,
              attachments: i.attachments,
            }),
        ),
        validate: query(
          {
            description: "Check whether an email address is deliverable.",
            input: object({ email: string({ minLength: 3 }) }),
          },
          async (_ctx, i) => c.post("/email/validate", {}, { email: i.email }),
        ),
        templates: query(
          {
            description: "List email templates. statusId 2 returns approved templates; keyword filters by name.",
            input: object({
              page: number().optional(),
              perPage: number().optional(),
              statusId: number().optional(),
              keyword: string().optional(),
            }),
          },
          async (_ctx, i) =>
            c.post("/email/templates", {
              with: "versions",
              page: i.page ?? 1,
              per_page: i.perPage ?? 25,
              status_id: i.statusId ?? 2,
              keyword: i.keyword ?? "",
              search_in: "name",
            }),
        ),
        logs: query(
          {
            description: "Email delivery logs between two dates (yyyy-mm-dd).",
            input: object(logOptions),
          },
          async (_ctx, i) => c.get("/report/logs/mail", i),
        ),
      },
      { title: "Email", description: "Send transactional email, validate addresses and read delivery logs." },
    ),
    whatsapp: router(
      {
        sendTemplate: mutation(
          {
            description:
              "Send an approved WhatsApp template to one or more recipients. payload is the WhatsApp payload: {type: \"template\", messaging_product: \"whatsapp\", template: {name, language: {code, policy}, to_and_components: [{to: [numbers], components: {body_1: {type, value}}}]}}.",
            input: object({ integratedNumber: string({ minLength: 1 }), payload: json() }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post("/whatsapp/whatsapp-outbound-message/bulk/", {}, {
              integrated_number: i.integratedNumber,
              content_type: "template",
              payload: i.payload,
            }),
        ),
        sendText: mutation(
          {
            description:
              "Send a free-form WhatsApp message inside an open 24-hour session. contentType is text, image, video, reaction or location.",
            input: object({
              integratedNumber: string({ minLength: 1 }),
              recipientNumber: string({ minLength: 1 }),
              contentType: string({ minLength: 1 }),
              text: string({ minLength: 1 }),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post("/whatsapp/whatsapp-outbound-message/", {
              integrated_number: i.integratedNumber,
              recipient_number: i.recipientNumber,
              content_type: i.contentType,
              text: i.text,
            }),
        ),
        templates: query(
          {
            description: "List WhatsApp templates for an integrated number, optionally filtered by name, status and language.",
            input: object({
              number: string({ minLength: 1 }),
              templateName: string().optional(),
              templateStatus: string().optional(),
              templateLanguage: string().optional(),
              pageSize: number().optional(),
              pageNum: number().optional(),
            }),
          },
          async (_ctx, i) =>
            c.get(`/whatsapp/get-template-client/${encodeURIComponent(i.number)}`, {
              template_name: i.templateName,
              template_status: i.templateStatus,
              template_language: i.templateLanguage,
              ...(i.pageSize !== undefined && i.pageNum !== undefined
                ? { pagination: "true", page_size: i.pageSize, page_num: i.pageNum }
                : {}),
            }),
        ),
        logs: query(
          {
            description: "WhatsApp message logs between two dates (yyyy-mm-dd).",
            input: object(logOptions),
          },
          async (_ctx, i) => c.get("/report/logs/wa", i),
        ),
        prepaidBalance: query(
          {
            description: "Check the prepaid WhatsApp balance of an integrated number.",
            input: object({ integratedNumber: string({ minLength: 1 }) }),
          },
          async (_ctx, i) =>
            c.post("/subscriptions/fetchPrepaidBalance", {}, { integrated_number: i.integratedNumber, service: "whatsapp" }),
        ),
      },
      { title: "WhatsApp", description: "Send WhatsApp templates and session messages, list templates and read logs." },
    ),
    voice: router(
      {
        send: mutation(
          {
            description:
              "Place a voice call that reads out a voice template. variables maps template variables to {type, value, ...}.",
            input: object({
              template: string({ minLength: 1 }),
              callerId: string({ minLength: 1 }),
              clientNumber: string({ minLength: 1 }),
              callbackUrl: string().optional(),
              variables: json().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post("/voice/call/", {}, {
              template: i.template,
              caller_id: i.callerId,
              client_number: i.clientNumber,
              callback_url: i.callbackUrl,
              variables: i.variables,
            }),
        ),
        logs: query(
          {
            description: "Voice call logs. filters is the optional JSON request body of MSG91's call-logs endpoint (dates, numbers, pagination).",
            input: object({ filters: json().optional() }),
          },
          async (_ctx, i) => c.post("/voice/call-logs/", {}, i.filters ?? {}),
        ),
      },
      { title: "Voice", description: "Place voice calls and read call logs." },
    ),
    contacts: router(
      {
        upsert: mutation(
          {
            description:
              "Create or update a contact in a Segmento phonebook. input holds the contact fields (name, email, mobiles, contact_id to update, custom fields). Set createFields false to avoid creating new dynamic fields.",
            input: object({ phonebookId: string({ minLength: 1 }), input: json(), createFields: json().optional() }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post(`/segmento/api/v1/phonebooks/${encodeURIComponent(i.phonebookId)}/contacts`, {}, {
              fields: i.createFields,
              input: i.input,
            }),
        ),
      },
      { title: "Contacts", description: "Manage Segmento phonebook contacts." },
    ),
    campaigns: router(
      {
        run: mutation(
          {
            description:
              "Launch a MSG91 campaign by slug. data is the request body: {sendTo: [{to: [{name, email, mobiles, variables}], cc?, bcc?, variables?}], attachments?}. scheduleFor (YYYY-MM-DD H:i) schedules the run; timezone defaults to Asia/Kolkata.",
            input: object({
              campaignSlug: string({ minLength: 1 }),
              data: json(),
              scheduleFor: string().optional(),
              timezone: string().optional(),
              timezoneBy: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            c.post(
              `/campaign/api/campaigns/${encodeURIComponent(i.campaignSlug)}/run`,
              { schedule_for: i.scheduleFor, timezone: i.timezone, timezone_by: i.timezoneBy },
              { data: i.data },
            ),
        ),
      },
      { title: "Campaigns", description: "Launch MSG91 campaigns." },
    ),
  });

export default defineApp(
  { user: { accounts: { msg91: msg91.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.msg91 ?? [], (account) => tools(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "MSG91",
        description:
          "MSG91 communications: SMS, OTP, email, WhatsApp, voice, contacts and campaigns, with delivery logs and analytics.",
        icons,
      },
    ),
  }),
);
