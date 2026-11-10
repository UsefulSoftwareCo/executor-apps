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

const base = "https://api.callerapi.com";

const callerapi = defineProvider({
  name: "CallerAPI",
  hosts: ["api.callerapi.com", "callerapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), publishToken: string().optional() }),
    }),
  },
  // /api/me is free and returns the account email and credit balance.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/me`, { signal, headers: { "x-auth": account.fields.token } });
    const me = await decodeJson(response, object({ email: string() }));
    return { accountInfo: { externalId: me.email, email: me.email } };
  },
});

type Account = { fields: { token: string; publishToken?: string | undefined } };

const headers = (account: Account) => ({ "x-auth": account.fields.token, Accept: "application/json" });

const phoneInput = string();
const webhookInput = object({ url: string() });

const voiceUrl = (path: string, params: Record<string, string | undefined>) => {
  const url = new URL(`${base}${path}`);
  url.searchParams.set("key", "YOUR_KEY");
  for (const [name, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(name, value);
  return {
    url: url.toString(),
    note: "Replace YOUR_KEY with your CallerAPI API key. The key is never filled in here so it does not appear in tool output.",
  };
};

const filterUrlInput = object({
  forward: string(),
  webhook: string().optional(),
  language: string().optional(),
  report: boolean().optional(),
  tracks: string().optional(),
});
const honeypotUrlInput = object({ persona: string().optional(), webhook: string().optional(), report: boolean().optional() });
const filterUrl = (path: string, input: { forward: string; webhook?: string | undefined; language?: string | undefined; report?: boolean | undefined; tracks?: string | undefined }) =>
  voiceUrl(path, {
    forward: input.forward,
    webhook: input.webhook,
    language: input.language,
    report: input.report === undefined ? undefined : String(input.report),
    tracks: input.tracks,
  });
const honeypotUrl = (path: string, input: { persona?: string | undefined; webhook?: string | undefined; report?: boolean | undefined }) =>
  voiceUrl(path, {
    persona: input.persona,
    webhook: input.webhook,
    report: input.report === undefined ? undefined : String(input.report),
  });

const callerapiTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, fetch: typeof globalThis.fetch) =>
    fetch(`${base}${path}`, { signal, headers: headers(account) }).then((response) => decodeJson(response, json()));
  const raw = async (path: string, fetch: typeof globalThis.fetch) => {
    const response = await fetch(`${base}${path}`, { signal, headers: { "x-auth": account.fields.token } });
    if (!response.ok) throw new Error(`CallerAPI ${path} failed with HTTP ${response.status}: ${await response.text()}`);
    return response;
  };
  const send = (method: "POST" | "DELETE", path: string, fetch: typeof globalThis.fetch, body?: unknown) =>
    fetch(`${base}${path}`, {
      method,
      signal,
      headers: { ...headers(account), "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }).then((response) => decodeJson(response, json()));

  return router({
    account: query(
      {
        description: "Get the authenticated account's email and credit usage: credits_spent, credits_monthly and credits_left. Free.",
        input: object({}),
      },
      async ({ fetch }) => get("/api/me", fetch),
    ),
    lookup: query(
      {
        description:
          "Look up a phone number: entity type, reputation (VERIFIED, SPAM, UNKNOWN), spam_score 0-100, is_spam, total_complaints, business_info (name, category, industry, city, state, country) and up to 200 recent complaints. Costs 1 credit. Pass phone in E.164 form, for example +16502530000. Set hlr to true to add carrier_info (current and original carrier, line type, ported status, timezone); it makes the call take longer but costs no extra credit.",
        input: object({ phone: phoneInput, hlr: boolean().optional() }),
      },
      async ({ fetch }, { phone, hlr }) =>
        get(`/api/lookup/${encodeURIComponent(phone)}${hlr === true ? "?hlr=true" : ""}`, fetch),
    ),
    ported: query(
      {
        description:
          "Get the last port date of a phone number: ported, ported_date and ported_date_type. Useful for SIM-swap and port-out fraud checks. Billed per lookup (about 0.008 EUR).",
        input: object({ phone: phoneInput }),
      },
      async ({ fetch }, { phone }) => get(`/api/ported/${encodeURIComponent(phone)}`, fetch),
    ),
    portingHistory: query(
      {
        description: "Get every past porting date of a phone number. Billed per lookup (about 0.02 EUR).",
        input: object({ phone: phoneInput }),
      },
      async ({ fetch }, { phone }) => get(`/api/porting-history/${encodeURIComponent(phone)}`, fetch),
    ),
    fraud: router(
      {
        onlinePresence: query(
          {
            description:
              "Check which online platforms (Amazon, Bukalapak, Facebook, Flipkart, Google, Instagram, LinkedIn, Skype, Telegram, Twitter, Viber, WhatsApp) have an account linked to a phone number. Each value is 1 active, 0 inactive, -1 unknown, -2 error. Costs about 0.15 EUR per lookup. Pass phone digits with country code, for example 12124567890.",
            input: object({ phone: phoneInput }),
          },
          async ({ fetch }, { phone }) => get(`/api/online-presence/${encodeURIComponent(phone.replace(/^\+/, ""))}`, fetch),
        ),
        kyc: mutation(
          {
            description:
              "Verify a user's identity details (name, date of birth, address, email) against mobile network operator records for a phone number. Returns a match score: 100 perfect, 75-99 strong, 50-74 partial, 1-49 weak, 0 no match, -1 unknown. Costs about 0.30 EUR per lookup and sends personal data to CallerAPI. Pass phone digits with country code.",
            input: object({
              phone: phoneInput,
              firstName: string(),
              lastName: string(),
              middleName: string().optional(),
              dobDay: string().optional(),
              dobMonth: string().optional(),
              dobYear: string().optional(),
              street: string().optional(),
              streetNo: string().optional(),
              unitNo: string().optional(),
              city: string().optional(),
              state: string().optional(),
              postcode: string().optional(),
              country: string().optional(),
              email: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            const compact = (values: Record<string, string | undefined>) => {
              const entries = Object.entries(values).filter(([, value]) => value !== undefined);
              return entries.length === 0 ? undefined : Object.fromEntries(entries);
            };
            const body = Object.fromEntries(
              Object.entries({
                name: compact({ first_name: input.firstName, middle_name: input.middleName, last_name: input.lastName }),
                dob: compact({ day: input.dobDay, month: input.dobMonth, year: input.dobYear }),
                address: compact({
                  street: input.street,
                  street_no: input.streetNo,
                  unit_no: input.unitNo,
                  city: input.city,
                  state: input.state,
                  postcode: input.postcode,
                  country: input.country,
                }),
                email: input.email,
              }).filter(([, value]) => value !== undefined),
            );
            return send("POST", `/api/kyc/${encodeURIComponent(input.phone.replace(/^\+/, ""))}`, fetch, body);
          },
        ),
      },
      { title: "Fraud prevention", description: "Online presence and KYC identity checks for a phone number (billed per lookup)." },
    ),
    signers: router(
      {
        reputation: query(
          {
            description:
              "Get the reputation of a STIR/SHAKEN signer by Service Provider Code (SPC, from the TNAuthList extension of the signing certificate). Returns known, score 0-100, band (low, elevated, high), confidence and call counts over the window. An unknown signer has known=false and no score.",
            input: object({ spc: string() }),
          },
          async ({ fetch }, { spc }) => get(`/api/signer-reputation/${encodeURIComponent(spc)}`, fetch),
        ),
        ranked: query(
          {
            description: "List STIR/SHAKEN signers ordered by reputation score, then calls. limit is 1 to 500 (default 50); minScore is 0 to 100 (default 0).",
            input: object({ limit: number().optional(), minScore: number().optional() }),
          },
          async ({ fetch }, { limit, minScore }) => {
            const params = new URLSearchParams();
            if (limit !== undefined) params.set("limit", String(limit));
            if (minScore !== undefined) params.set("min_score", String(minScore));
            const qs = params.toString();
            return get(`/api/signer-reputation${qs === "" ? "" : `?${qs}`}`, fetch);
          },
        ),
      },
      { title: "Signer reputation", description: "STIR/SHAKEN signer reputation by SPC." },
    ),
    businessCallerId: router(
      {
        verify: mutation(
          {
            description:
              "Verify a call at INVITE: send the calling number (from) and called number (to), both E.164. Returns a verdict: verified (owner announced this call), spoofed (recommend drop), unverified, or unregistered. Verify is free for the telco; a verified verdict credits 1 credit to the telco and was prepaid by the business. Optional assertion is a compact JWS the switch received in-band. The called number is not stored.",
            input: object({ from: string(), to: string(), assertion: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { from, to, assertion }) =>
            send("POST", "/api/bcid/v1/verify", fetch, { from, to, ...(assertion === undefined ? {} : { assertion }) }),
        ),
        logo: query(
          {
            description:
              "Fetch a reviewed Business Caller ID logo by identity.logo_id (16 hex characters) from a verified response. Returns the PNG as base64 with its content type. No credit is charged; the image never changes under its id.",
            input: object({ logoId: string() }),
          },
          async ({ fetch }, { logoId }) => {
            const response = await raw(`/api/bcid/v1/logos/${encodeURIComponent(logoId)}`, fetch);
            const bytes = new Uint8Array(await response.arrayBuffer());
            let binary = "";
            for (const byte of bytes) binary += String.fromCharCode(byte);
            return { contentType: response.headers.get("content-type") ?? "image/png", base64: btoa(binary) };
          },
        ),
        announce: mutation(
          {
            description:
              "Announce a call from the originating dialler at dial time: from is an approved business number you own and to is the callee, both E.164. The announcement is valid 90 seconds and costs 2 credits. Requires the Business Caller ID publish token (set on the connection as publishToken), which is separate from the API key.",
            input: object({ from: string(), to: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            if (account.fields.publishToken === undefined || account.fields.publishToken === "")
              throw new Error("Announcing a call needs the Business Caller ID publish token. Add it as publishToken on the CallerAPI connection.");
            const response = await fetch(`${base}/api/bcid/v1/calls`, {
              method: "POST",
              signal,
              headers: { "X-BCID-Publish-Token": account.fields.publishToken, Accept: "application/json", "content-type": "application/json" },
              body: JSON.stringify(input),
            });
            return decodeJson(response, json());
          },
        ),
      },
      { title: "Business Caller ID", description: "Verify and announce branded business calls, and fetch verified logos." },
    ),
    voiceFirewall: router(
      {
        capabilities: query(
          {
            description: "Report which voice firewall products are on for this deployment (scan, live_filter, honeypot) and the credit prices in force. Free.",
            input: object({}),
          },
          async ({ fetch }) => get("/api/voice/capabilities", fetch),
        ),
        categories: query(
          {
            description: "List every value verdict.category can take with a description. Values match CallerAPI complaint subjects. none means a clean call. Free.",
            input: object({}),
          },
          async ({ fetch }) => get("/api/voice/categories", fetch),
        ),
        personas: query(
          {
            description: "List the honeypot personas. Pass an id as persona to use one character on every call. Free.",
            input: object({}),
          },
          async ({ fetch }) => get("/api/voice/personas", fetch),
        ),
        scan: mutation(
          {
            description:
              "Score one call after the fact from a transcript or from base64 audio; send exactly one of transcript or audioBase64. Costs 2 credits plus 1 credit per started minute of audio, and creates a session. Body limit 25 MB. encoding is wav (default), pcm16 (needs sampleRate 8000-48000) or mulaw. With report=true and from set, a score of 0.8 or more files the caller and callback numbers as a complaint. from and to are E.164.",
            input: object({
              transcript: string().optional(),
              audioBase64: string().optional(),
              encoding: string().optional(),
              sampleRate: number().optional(),
              language: string().optional(),
              from: string().optional(),
              to: string().optional(),
              report: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            if ((input.transcript === undefined) === (input.audioBase64 === undefined))
              throw new Error("Send exactly one of transcript or audioBase64.");
            const body = Object.fromEntries(
              Object.entries({
                transcript: input.transcript,
                audio_base64: input.audioBase64,
                encoding: input.encoding,
                sample_rate: input.sampleRate,
                language: input.language,
                from: input.from,
                to: input.to,
                report: input.report,
              }).filter(([, value]) => value !== undefined),
            );
            return send("POST", "/api/voice/scan", fetch, body);
          },
        ),
        sessions: query(
          {
            description: "List recent filter, honeypot and scan sessions for this key, newest first. limit is 1 to 200 (default 50). Free.",
            input: object({ limit: number().optional() }),
          },
          async ({ fetch }, { limit }) => get(`/api/voice/sessions${limit === undefined ? "" : `?limit=${limit}`}`, fetch),
        ),
        session: query(
          {
            description: "Get one session by id (the session_id from an event or a scan) with its verdict and intel. Use it to recover a missed webhook or answer a dispute. Free.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) => get(`/api/voice/sessions/${encodeURIComponent(id)}`, fetch),
        ),
        twilioFilterUrl: query(
          {
            description:
              "Build the Twilio voice URL for a screened number (POST /api/voice/filter/twiml). forward is the E.164 number the call rings; webhook is the HTTPS URL receiving events; report files the caller when the final level is scam; tracks=both also transcribes the called party. Returns a URL with the placeholder YOUR_KEY in place of the API key. Makes no request.",
            input: filterUrlInput,
          },
          async (_ctx, input) => filterUrl("/api/voice/filter/twiml", input),
        ),
        telnyxFilterUrl: query(
          {
            description: "Build the Telnyx TeXML Application Voice URL for a screened number (/api/voice/filter/texml). Same options as twilioFilterUrl. Makes no request.",
            input: filterUrlInput,
          },
          async (_ctx, input) => filterUrl("/api/voice/filter/texml", input),
        ),
        twilioHoneypotUrl: query(
          {
            description:
              "Build the Twilio voice URL for a honeypot number (/api/voice/honeypot/twiml). persona is an id from personas (default random); report=false turns filing off. Calls cost 8 credits per started minute, up to 15 minutes. Makes no request.",
            input: honeypotUrlInput,
          },
          async (_ctx, input) => honeypotUrl("/api/voice/honeypot/twiml", input),
        ),
        telnyxHoneypotUrl: query(
          {
            description: "Build the Telnyx TeXML Application Voice URL for a honeypot number (/api/voice/honeypot/texml). Same options as twilioHoneypotUrl. Makes no request.",
            input: honeypotUrlInput,
          },
          async (_ctx, input) => honeypotUrl("/api/voice/honeypot/texml", input),
        ),
      },
      { title: "Voice firewall", description: "Scan calls for scams, inspect sessions, and build Twilio/Telnyx voice URLs." },
    ),
    spamReports: router(
      {
        csvSnapshot: query(
          {
            description:
              "Download the 15-day snapshot of verified spam reports as CSV (column company_phone_number), for a local blocklist. Enterprise+ or Partner plans only, flat pricing.",
            input: object({}),
          },
          async ({ fetch }) => ({ csv: await (await raw("/api/spam-reports/csv", fetch)).text() }),
        ),
        daily: query(
          {
            description:
              "Fetch the daily spam reports collected for one country. countryCode is one of US, CA, BR, AR, RU, KZ, UA, MX, TR, IN, ZA, CL, CH, DE, FR, ES, IE, IT, NL, PL, RO, BY, EE, BE, AU. Enterprise plans only.",
            input: object({ countryCode: string() }),
          },
          async ({ fetch }, { countryCode }) => get(`/api/spam-reports/daily/${encodeURIComponent(countryCode)}`, fetch),
        ),
        subscriptions: query(
          {
            description: "List the webhook endpoints subscribed to daily spam complaint reports. Enterprise plans only.",
            input: object({}),
          },
          async ({ fetch }) => get("/api/webhooks/complaints/subscriptions", fetch),
        ),
        subscribe: mutation(
          {
            description:
              "Subscribe an HTTPS webhook URL to daily spam complaint reports. Deliveries are signed: X-CA-Sig is sha256= plus the hex HMAC-SHA256 of X-CA-Delivery keyed with your API key. Enterprise plans only.",
            input: webhookInput,
            approval: always(),
          },
          async ({ fetch }, input) => send("POST", "/api/webhooks/complaints/subscribe", fetch, input),
        ),
        unsubscribe: mutation(
          {
            description: "Remove a webhook URL from daily spam complaint reports. Enterprise plans only.",
            input: webhookInput,
            approval: always(),
          },
          async ({ fetch }, input) => send("DELETE", "/api/webhooks/complaints/subscribe", fetch, input),
        ),
        testWebhook: mutation(
          {
            description:
              "Send a sample complaints payload to an HTTPS URL to test your endpoint and signature verification. Enterprise plans only.",
            input: webhookInput,
            approval: always(),
          },
          async ({ fetch }, input) => send("POST", "/api/webhooks/complaints/test", fetch, input),
        ),
        dispatch: mutation(
          {
            description: "Trigger delivery of today's spam complaint webhook now. Enterprise plans only.",
            input: object({}),
            approval: always(),
          },
          async ({ fetch }) => send("POST", "/api/webhooks/complaints/dispatch", fetch),
        ),
      },
      { title: "Spam reports", description: "Daily spam complaint reports and webhook subscriptions (enterprise plans)." },
    ),
  });
};

export default defineApp({ user: { accounts: { callerapi: callerapi.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.callerapi ?? [], (account) => callerapiTools(account, signal), { signal }), {
    title: "CallerAPI",
    description: "Caller ID, spam score, carrier (HLR) and number porting lookups, and daily spam report webhooks, fraud checks, signer reputation, Business Caller ID and the voice firewall.",
    icons,
  }),
}));
