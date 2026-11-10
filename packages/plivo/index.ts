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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.plivo.com";
const lookupOrigin = "https://lookup.plivo.com";

const plivo = defineProvider({
  name: "Plivo",
  hosts: ["api.plivo.com", "lookup.plivo.com"],
  auth: {
    apiKey: secrets({
      label: "Auth ID and Auth Token (shown on the Plivo console overview page)",
      fields: object({ authId: string({ minLength: 1 }), authToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { authId, authToken } = account.fields;
    const response = await fetch(`${origin}/v1/Account/${encodeURIComponent(authId)}/`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${authId}:${authToken}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(authId: string, authToken: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const authorization = `Basic ${btoa(`${authId}:${authToken}`)}`;
  const account = `/v1/Account/${encodeURIComponent(authId)}`;
  const seg = encodeURIComponent;
  const send = async (url: URL, method: string, body?: Params) => {
    const response = await fetcher(url, {
      method,
      signal,
      headers: {
        Authorization: authorization,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Successful DELETEs return 204 with no body.
    if (response.status === 204) return { deleted: true };
    return decodeJson(response, json());
  };
  const withQuery = (url: URL, params: Params | undefined) => {
    for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    return url;
  };
  return {
    seg,
    get: (path: string, params?: Params) => send(withQuery(new URL(`${origin}${account}${path}`), params), "GET"),
    post: (path: string, body: Params) => send(new URL(`${origin}${account}${path}`), "POST", body),
    del: (path: string) => send(new URL(`${origin}${account}${path}`), "DELETE"),
    lookup: (number: string, params: Params) => send(withQuery(new URL(`${lookupOrigin}/v1/Number/${seg(number)}`), params), "GET"),
  };
}

const optString = (description?: string) => string().optional();
const page = { limit: number().optional(), offset: number().optional() };

function build(api: ReturnType<typeof client>) {
  const { seg } = api;
  const pick = <T extends Record<string, unknown>>(input: T, omit: string[] = []): Params => {
    const out: Params = {};
    for (const [key, value] of Object.entries(input)) {
      if (omit.includes(key) || value === undefined) continue;
      out[key] = value as string | number | boolean;
    }
    return out;
  };

  return router({
    account: router(
      {
        get: query(
          { description: "Get the account's details: name, cash credits, billing mode, timezone and resource URI.", input: object({}) },
          async () => api.get("/"),
        ),
        update: mutation(
          {
            description: "Update the account's name, city or address.",
            input: object({ name: optString(), city: optString(), address: optString() }),
          },
          async (_ctx, input) => api.post("/", pick(input)),
        ),
        usageSummary: query(
          {
            description:
              "Get a usage summary (messages, calls and spend) for the account. Filter by date range (YYYY-MM-DD) or by product.",
            input: object({ startDate: optString(), endDate: optString(), product: optString(), ...page }),
          },
          async (_ctx, i) =>
            api.get("/UsageSummary/", { start_date: i.startDate, end_date: i.endDate, product: i.product, limit: i.limit, offset: i.offset }),
        ),
        pricing: query(
          {
            description: "Get Plivo's voice, SMS and MMS pricing for a country. countryIso is a two-letter ISO code such as US.",
            input: object({ countryIso: string({ minLength: 2 }) }),
          },
          async (_ctx, i) => api.get("/Pricing/", { country_iso: i.countryIso }),
        ),
      },
      { title: "Account", description: "Account details, usage and pricing." },
    ),
    subaccounts: router(
      {
        list: query({ description: "List subaccounts.", input: object({ ...page }) }, async (_ctx, i) => api.get("/Subaccount/", pick(i))),
        get: query(
          { description: "Get a subaccount by its auth ID.", input: object({ subauthId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Subaccount/${seg(i.subauthId)}/`),
        ),
        create: mutation(
          {
            description: "Create a subaccount. The response includes its auth ID and auth token.",
            input: object({ name: string({ minLength: 1 }), enabled: boolean().optional() }),
          },
          async (_ctx, i) => api.post("/Subaccount/", pick(i)),
        ),
        update: mutation(
          {
            description: "Rename, enable or disable a subaccount.",
            input: object({ subauthId: string({ minLength: 1 }), name: string({ minLength: 1 }), enabled: boolean().optional() }),
          },
          async (_ctx, i) => api.post(`/Subaccount/${seg(i.subauthId)}/`, pick(i, ["subauthId"])),
        ),
        delete: mutation(
          { description: "Delete a subaccount.", input: object({ subauthId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Subaccount/${seg(i.subauthId)}/`),
        ),
      },
      { title: "Subaccounts", description: "Manage subaccounts under the main account." },
    ),
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send an SMS, MMS or WhatsApp message. Provide src (sender number, short code or alphanumeric ID) or powerpackUuid. dst is E.164; separate several recipients with '<'. type defaults to sms; for mms pass mediaUrls. WhatsApp templates, interactive and location payloads go in template, interactive and location. Sends a real message and bills the account.",
            input: object({
              dst: string({ minLength: 1 }),
              src: optString(),
              powerpackUuid: optString(),
              text: optString(),
              type: optString(),
              mediaUrls: string().optional(),
              mediaIds: string().optional(),
              template: json().optional(),
              interactive: json().optional(),
              location: json().optional(),
              url: optString(),
              method: optString(),
              log: optString(),
              trackable: boolean().optional(),
              messageExpiry: number().optional(),
            }),
          },
          async (_ctx, i) => {
            const body: Record<string, unknown> = {
              dst: i.dst,
              src: i.src,
              powerpack_uuid: i.powerpackUuid,
              text: i.text,
              type: i.type,
              media_urls: i.mediaUrls === undefined ? undefined : i.mediaUrls.split(",").map((s) => s.trim()),
              media_ids: i.mediaIds === undefined ? undefined : i.mediaIds.split(",").map((s) => s.trim()),
              template: i.template,
              interactive: i.interactive,
              location: i.location,
              url: i.url,
              method: i.method,
              log: i.log,
              trackable: i.trackable,
              message_expiry: i.messageExpiry,
            };
            for (const key of Object.keys(body)) if (body[key] === undefined) delete body[key];
            return api.post("/Message/", body as Params);
          },
        ),
        list: query(
          {
            description:
              "List message records. Filter by direction (inbound/outbound), state (queued, sent, delivered, undelivered, failed, received), type (sms, mms, whatsapp), time ('yyyy-MM-dd HH:mm:ss'), error code, subaccount or powerpack. limit max is 20.",
            input: object({
              subaccount: optString(),
              messageDirection: optString(),
              messageState: optString(),
              messageType: optString(),
              messageTimeGreaterThan: optString(),
              messageTimeLessThan: optString(),
              errorCode: number().optional(),
              powerpackId: optString(),
              ...page,
            }),
          },
          async (_ctx, i) =>
            api.get("/Message/", {
              subaccount: i.subaccount,
              message_direction: i.messageDirection,
              message_state: i.messageState,
              message_type: i.messageType,
              message_time__gt: i.messageTimeGreaterThan,
              message_time__lt: i.messageTimeLessThan,
              error_code: i.errorCode,
              powerpack_id: i.powerpackId,
              limit: i.limit,
              offset: i.offset,
            }),
        ),
        get: query(
          { description: "Get one message record by UUID.", input: object({ messageUuid: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Message/${seg(i.messageUuid)}/`),
        ),
        listMedia: query(
          { description: "List the media files attached to an MMS message.", input: object({ messageUuid: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Message/${seg(i.messageUuid)}/Media/`),
        ),
      },
      { title: "Messages", description: "Send and look up SMS, MMS and WhatsApp messages." },
    ),
    calls: router(
      {
        create: mutation(
          {
            description:
              "Make an outbound call. from is the caller ID (E.164), to is the destination number or SIP URI (separate several with '<', max 1000), answerUrl must return Plivo XML. Places a real call and bills the account.",
            input: object({
              from: string({ minLength: 1 }),
              to: string({ minLength: 1 }),
              answerUrl: string({ minLength: 1 }),
              answerMethod: optString(),
              ringUrl: optString(),
              ringMethod: optString(),
              hangupUrl: optString(),
              hangupMethod: optString(),
              fallbackUrl: optString(),
              fallbackMethod: optString(),
              callerName: optString(),
              sendDigits: optString(),
              timeLimit: number().optional(),
              hangupOnRing: number().optional(),
              ringTimeout: number().optional(),
              machineDetection: optString(),
              machineDetectionTime: number().optional(),
              machineDetectionUrl: optString(),
              machineDetectionMethod: optString(),
              sipHeaders: optString(),
            }),
          },
          async (_ctx, i) =>
            api.post("/Call/", {
              ...pick({
                answer_url: i.answerUrl, answer_method: i.answerMethod, ring_url: i.ringUrl, ring_method: i.ringMethod,
                hangup_url: i.hangupUrl, hangup_method: i.hangupMethod, fallback_url: i.fallbackUrl, fallback_method: i.fallbackMethod,
                caller_name: i.callerName, send_digits: i.sendDigits, time_limit: i.timeLimit, hangup_on_ring: i.hangupOnRing,
                ring_timeout: i.ringTimeout, machine_detection: i.machineDetection, machine_detection_time: i.machineDetectionTime,
                machine_detection_url: i.machineDetectionUrl, machine_detection_method: i.machineDetectionMethod, sip_headers: i.sipHeaders,
              }),
              from: i.from,
              to: i.to,
            }),
        ),
        list: query(
          {
            description:
              "List completed call detail records. Filter by from/to number, direction (inbound/outbound), subaccount, end time or hangup cause.",
            input: object({
              subaccount: optString(),
              callDirection: optString(),
              fromNumber: optString(),
              toNumber: optString(),
              endTimeGreaterThan: optString(),
              endTimeLessThan: optString(),
              hangupCauseCode: number().optional(),
              ...page,
            }),
          },
          async (_ctx, i) =>
            api.get("/Call/", {
              subaccount: i.subaccount,
              call_direction: i.callDirection,
              from_number: i.fromNumber,
              to_number: i.toNumber,
              end_time__gt: i.endTimeGreaterThan,
              end_time__lt: i.endTimeLessThan,
              hangup_cause_code: i.hangupCauseCode,
              limit: i.limit,
              offset: i.offset,
            }),
        ),
        get: query(
          { description: "Get the detail record of one call by UUID.", input: object({ callUuid: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Call/${seg(i.callUuid)}/`),
        ),
        listLive: query(
          { description: "List calls currently in progress.", input: object({}) },
          async () => api.get("/Call/", { status: "live" }),
        ),
        getLive: query(
          { description: "Get the live state of a call in progress.", input: object({ callUuid: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Call/${seg(i.callUuid)}/`, { status: "live" }),
        ),
        listQueued: query(
          { description: "List calls queued but not yet started.", input: object({}) },
          async () => api.get("/Call/", { status: "queued" }),
        ),
        hangup: mutation(
          { description: "Hang up a call in progress, or cancel a queued one.", input: object({ callUuid: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Call/${seg(i.callUuid)}/`),
        ),
        transfer: mutation(
          {
            description:
              "Transfer a live call to new Plivo XML. legs is aleg, bleg or both; aleg/bleg URLs must return Plivo XML.",
            input: object({
              callUuid: string({ minLength: 1 }),
              legs: optString(),
              alegUrl: optString(),
              alegMethod: optString(),
              blegUrl: optString(),
              blegMethod: optString(),
            }),
          },
          async (_ctx, i) =>
            api.post(`/Call/${seg(i.callUuid)}/`, {
              ...pick({ legs: i.legs, aleg_url: i.alegUrl, aleg_method: i.alegMethod, bleg_url: i.blegUrl, bleg_method: i.blegMethod }),
            }),
        ),
        record: mutation(
          {
            description: "Start recording a live call. fileFormat is mp3 or wav; callbackUrl receives the recording URL when it ends.",
            input: object({
              callUuid: string({ minLength: 1 }),
              timeLimit: number().optional(),
              fileFormat: optString(),
              transcriptionType: optString(),
              transcriptionUrl: optString(),
              callbackUrl: optString(),
              callbackMethod: optString(),
            }),
          },
          async (_ctx, i) =>
            api.post(`/Call/${seg(i.callUuid)}/Record/`, {
              ...pick({
                time_limit: i.timeLimit, file_format: i.fileFormat, transcription_type: i.transcriptionType,
                transcription_url: i.transcriptionUrl, callback_url: i.callbackUrl, callback_method: i.callbackMethod,
              }),
            }),
        ),
        play: mutation(
          {
            description: "Play audio into a live call. urls is one or more audio URLs separated by commas.",
            input: object({
              callUuid: string({ minLength: 1 }),
              urls: string({ minLength: 1 }),
              length: number().optional(),
              legs: optString(),
              loop: boolean().optional(),
              mix: boolean().optional(),
            }),
          },
          async (_ctx, i) => api.post(`/Call/${seg(i.callUuid)}/Play/`, pick(i, ["callUuid"])),
        ),
        speak: mutation(
          {
            description: "Speak text into a live call using text-to-speech.",
            input: object({
              callUuid: string({ minLength: 1 }),
              text: string({ minLength: 1 }),
              voice: optString(),
              language: optString(),
              legs: optString(),
              loop: boolean().optional(),
              mix: boolean().optional(),
            }),
          },
          async (_ctx, i) => api.post(`/Call/${seg(i.callUuid)}/Speak/`, pick(i, ["callUuid"])),
        ),
        sendDigits: mutation(
          {
            description: "Send DTMF digits on a live call. legs is aleg, bleg or both.",
            input: object({ callUuid: string({ minLength: 1 }), digits: string({ minLength: 1 }), legs: optString() }),
          },
          async (_ctx, i) => api.post(`/Call/${seg(i.callUuid)}/DTMF/`, pick(i, ["callUuid"])),
        ),
      },
      { title: "Calls", description: "Make calls, inspect call records and control live calls." },
    ),
    recordings: router(
      {
        list: query(
          {
            description: "List call recordings. Filter by subaccount, call UUID or add-time ('yyyy-MM-dd HH:mm:ss').",
            input: object({
              subaccount: optString(),
              callUuid: optString(),
              addTimeGreaterThan: optString(),
              addTimeLessThan: optString(),
              ...page,
            }),
          },
          async (_ctx, i) =>
            api.get("/Recording/", {
              subaccount: i.subaccount,
              call_uuid: i.callUuid,
              add_time__gt: i.addTimeGreaterThan,
              add_time__lt: i.addTimeLessThan,
              limit: i.limit,
              offset: i.offset,
            }),
        ),
        get: query(
          { description: "Get one recording, including its URL.", input: object({ recordingId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Recording/${seg(i.recordingId)}/`),
        ),
        delete: mutation(
          { description: "Delete a recording.", input: object({ recordingId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Recording/${seg(i.recordingId)}/`),
        ),
      },
      { title: "Recordings", description: "Call recordings." },
    ),
    conferences: router(
      {
        list: query({ description: "List the names of live conferences.", input: object({}) }, async () => api.get("/Conference/")),
        get: query(
          { description: "Get a live conference and its members.", input: object({ conferenceName: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Conference/${seg(i.conferenceName)}/`),
        ),
        hangupAll: mutation({ description: "Hang up every live conference.", input: object({}) }, async () => api.del("/Conference/")),
        hangup: mutation(
          { description: "Hang up one live conference and all its members.", input: object({ conferenceName: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Conference/${seg(i.conferenceName)}/`),
        ),
        kickMember: mutation(
          {
            description: "Remove one member from a live conference.",
            input: object({ conferenceName: string({ minLength: 1 }), memberId: string({ minLength: 1 }) }),
          },
          async (_ctx, i) => api.post(`/Conference/${seg(i.conferenceName)}/Member/${seg(i.memberId)}/Kick/`, {}),
        ),
      },
      { title: "Conferences", description: "Live conferences and their members." },
    ),
    numbers: router(
      {
        search: query(
          {
            description:
              "Search phone numbers available to rent. countryIso is required (e.g. US); type is local, tollfree, mobile or fixed; pattern matches digits (e.g. an area code).",
            input: object({
              countryIso: string({ minLength: 2 }),
              type: optString(),
              pattern: optString(),
              region: optString(),
              services: optString(),
              ...page,
            }),
          },
          async (_ctx, i) =>
            api.get("/PhoneNumber/", {
              country_iso: i.countryIso, type: i.type, pattern: i.pattern, region: i.region, services: i.services,
              limit: i.limit, offset: i.offset,
            }),
        ),
        rent: mutation(
          {
            description: "Rent (buy) a phone number found by numbers.search. Charges the account.",
            input: object({ number: string({ minLength: 1 }), appId: optString() }),
          },
          async (_ctx, i) => api.post(`/PhoneNumber/${seg(i.number)}/`, pick({ app_id: i.appId })),
        ),
        list: query(
          {
            description: "List the numbers rented on the account. Filter by type, number prefix, services or subaccount.",
            input: object({
              type: optString(),
              numberStartsWith: optString(),
              services: optString(),
              alias: optString(),
              subaccount: optString(),
              ...page,
            }),
          },
          async (_ctx, i) =>
            api.get("/Number/", {
              type: i.type, number_startswith: i.numberStartsWith, services: i.services, alias: i.alias,
              subaccount: i.subaccount, limit: i.limit, offset: i.offset,
            }),
        ),
        get: query(
          { description: "Get one rented number.", input: object({ number: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Number/${seg(i.number)}/`),
        ),
        update: mutation(
          {
            description: "Attach an application to a rented number, or change its alias or subaccount.",
            input: object({ number: string({ minLength: 1 }), appId: optString(), subaccount: optString(), alias: optString() }),
          },
          async (_ctx, i) => api.post(`/Number/${seg(i.number)}/`, pick({ app_id: i.appId, subaccount: i.subaccount, alias: i.alias })),
        ),
        release: mutation(
          { description: "Release (delete) a rented number.", input: object({ number: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Number/${seg(i.number)}/`),
        ),
      },
      { title: "Numbers", description: "Search, rent, configure and release phone numbers." },
    ),
    applications: router(
      {
        list: query(
          { description: "List applications (answer, hangup and message URL sets).", input: object({ subaccount: optString(), ...page }) },
          async (_ctx, i) => api.get("/Application/", pick(i)),
        ),
        get: query(
          { description: "Get one application.", input: object({ appId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Application/${seg(i.appId)}/`),
        ),
        create: mutation(
          {
            description: "Create an application with answer, hangup and message URLs.",
            input: object({
              appName: string({ minLength: 1 }),
              answerUrl: optString(),
              answerMethod: optString(),
              hangupUrl: optString(),
              hangupMethod: optString(),
              fallbackAnswerUrl: optString(),
              fallbackMethod: optString(),
              messageUrl: optString(),
              messageMethod: optString(),
              defaultApp: boolean().optional(),
              subaccount: optString(),
            }),
          },
          async (_ctx, i) =>
            api.post("/Application/", pick({
              app_name: i.appName, answer_url: i.answerUrl, answer_method: i.answerMethod, hangup_url: i.hangupUrl,
              hangup_method: i.hangupMethod, fallback_answer_url: i.fallbackAnswerUrl, fallback_method: i.fallbackMethod,
              message_url: i.messageUrl, message_method: i.messageMethod, default_app: i.defaultApp, subaccount: i.subaccount,
            })),
        ),
        update: mutation(
          {
            description: "Update an application's URLs and methods.",
            input: object({
              appId: string({ minLength: 1 }),
              answerUrl: optString(),
              answerMethod: optString(),
              hangupUrl: optString(),
              hangupMethod: optString(),
              fallbackAnswerUrl: optString(),
              fallbackMethod: optString(),
              messageUrl: optString(),
              messageMethod: optString(),
              defaultApp: boolean().optional(),
              subaccount: optString(),
            }),
          },
          async (_ctx, i) =>
            api.post(`/Application/${seg(i.appId)}/`, pick({
              answer_url: i.answerUrl, answer_method: i.answerMethod, hangup_url: i.hangupUrl, hangup_method: i.hangupMethod,
              fallback_answer_url: i.fallbackAnswerUrl, fallback_method: i.fallbackMethod, message_url: i.messageUrl,
              message_method: i.messageMethod, default_app: i.defaultApp, subaccount: i.subaccount,
            })),
        ),
        delete: mutation(
          { description: "Delete an application.", input: object({ appId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Application/${seg(i.appId)}/`),
        ),
      },
      { title: "Applications", description: "Applications that route incoming calls and messages." },
    ),
    endpoints: router(
      {
        list: query(
          { description: "List SIP endpoints.", input: object({ subaccount: optString(), ...page }) },
          async (_ctx, i) => api.get("/Endpoint/", pick(i)),
        ),
        get: query(
          { description: "Get one SIP endpoint.", input: object({ endpointId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.get(`/Endpoint/${seg(i.endpointId)}/`),
        ),
        create: mutation(
          {
            description: "Create a SIP endpoint (username, password and alias; optional application).",
            input: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }), alias: string({ minLength: 1 }), appId: optString() }),
          },
          async (_ctx, i) => api.post("/Endpoint/", pick({ username: i.username, password: i.password, alias: i.alias, app_id: i.appId })),
        ),
        update: mutation(
          {
            description: "Update a SIP endpoint's password, alias or application.",
            input: object({ endpointId: string({ minLength: 1 }), password: optString(), alias: optString(), appId: optString() }),
          },
          async (_ctx, i) =>
            api.post(`/Endpoint/${seg(i.endpointId)}/`, pick({ password: i.password, alias: i.alias, app_id: i.appId })),
        ),
        delete: mutation(
          { description: "Delete a SIP endpoint.", input: object({ endpointId: string({ minLength: 1 }) }) },
          async (_ctx, i) => api.del(`/Endpoint/${seg(i.endpointId)}/`),
        ),
      },
      { title: "Endpoints", description: "SIP endpoints for softphones and WebRTC clients." },
    ),
    lookup: router(
      {
        number: query(
          {
            description:
              "Look up a phone number with the Lookup API (E.164 with +). type=carrier adds carrier and line type. Lookups are billed.",
            input: object({ number: string({ minLength: 1 }), type: optString() }),
          },
          async (_ctx, i) => api.lookup(i.number, { type: i.type }),
        ),
      },
      { title: "Lookup", description: "Phone number carrier and format lookup." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { plivo: plivo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.plivo ?? [],
        (account) =>
          withApprovals(build(client(account.fields.authId, account.fields.authToken, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Plivo",
        description:
          "Send SMS, MMS and WhatsApp messages, make and control voice calls, manage phone numbers, applications, SIP endpoints, recordings and conferences, and look up numbers with Plivo.",
        icons,
      },
    ),
  }),
);
