import {
  accountRouter,
  defineApp,
  defineProvider,
  mutation,
  object,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.realvalidation.com/rpvWebService";

const realphonevalidation = defineProvider({
  name: "RealPhoneValidation",
  hosts: ["api.realvalidation.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // RealPhoneValidation documents no free account endpoint, and its docs do not say whether a
  // rejected or invalid request is billed, so this check may consume one lookup. A Turbo call for a
  // non-dialable number answers status "unauthorized" for a bad token; only status is decoded.
  async health({ account, fetch, signal }) {
    const params = new URLSearchParams({ phone: "0000000000", token: account.fields.token, output: "json" });
    const response = await fetch(`${base}/Turbo.php?${params}`, { signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`RealPhoneValidation health check failed with HTTP ${response.status}`);
    let status = "";
    try {
      const body: unknown = JSON.parse(text);
      if (typeof body === "object" && body !== null && "status" in body) status = String((body as { status: unknown }).status);
    } catch {
      status = text;
    }
    if (/unauthorized/i.test(status)) throw new Error("RealPhoneValidation rejected the token");
  },
});

type Account = { fields: { token: string } };

// Responses are JSON when asked for, but the docs' samples are not always valid JSON and the
// fraud and active endpoints document XML only, so fall back to the raw text.
const parse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const phone = string({ minLength: 10 });

const tools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetch: typeof globalThis.fetch,
    endpoint: string,
    args: Record<string, string>,
    json_ = true,
  ) => {
    const params = new URLSearchParams({ ...args, token: account.fields.token });
    if (json_) params.set("output", "json");
    const response = await fetch(`${base}/${endpoint}?${params}`, { signal });
    if (!response.ok) throw new Error(`RealPhoneValidation ${endpoint} failed with HTTP ${response.status}`);
    return parse(await response.text());
  };

  const lookup = (endpoint: string, description: string, opts: { json?: boolean; phoneKey?: string } = {}) =>
    mutation(
      {
        description: `${description} phone is 10 US digits only (7275555555). Billed per lookup; limit 10 calls per second.`,
        input: object({ phone }),
        approval: always(),
      },
      async ({ fetch }, { phone }) => call(fetch, endpoint, { [opts.phoneKey ?? "phone"]: phone }, opts.json ?? true),
    );

  return router({
    turboV3: lookup(
      "TurboV3.php",
      "Real-time US phone check: status (connected, disconnected, busy, unreachable, invalid-phone and more), phone_type (Mobile, Landline, VoIP), carrier, caller_name and caller_type. Errors come back in status and error_text (unauthorized, ERROR, invalid-format).",
    ),
    turbo: lookup(
      "Turbo.php",
      "Standard Turbo check: connected/disconnected status and phone_type (Mobile, Landline, VoIP).",
    ),
    scrubPlus: lookup(
      "ScrubPlus.php",
      "Scrub Plus: connected/disconnected status and phone_type. May return unknown for up to 5% of US numbers.",
    ),
    scrub: lookup(
      "RealPhoneValidationScrub.php",
      "RPV Scrub: connected/disconnected status, plus iscell (Y cell, N landline, V VoIP) and carrier when those add-ons are enabled on the account.",
    ),
    active: lookup(
      "RealPhoneValidationActive.php",
      "RPV Active: whether the number is on a still-operating carrier. RESPONSECODE is L (active landline), C (active cell), V (active VoIP, if enabled), N (inactive) or unauthorized. This does not mean the line is connected to a subscriber. Documented as XML only, so the result may be { raw }.",
      { json: false },
    ),
    wirelessId: lookup(
      "WirelessID.php",
      "Wireless ID: whether the number is a cell phone or landline (RESPONSECODE landline, cell, or -1 with RESPONSEMSG), used for TCPA checks. Compare case-insensitively.",
      { phoneKey: "Phone" },
    ),
    dncLookup: lookup(
      "DNCLookup.php",
      "DNC Lookup: national_dnc, state_dnc, dma and litigator flags (Y, N or ? on timeout) and iscell. Requires a SAN from telemarketing.donotcall.gov on the account.",
    ),
    dncPlus: lookup(
      "DNCPlus.php",
      "DNC Plus: DNC Lookup data (national_dnc, state_dnc, dma, litigator) plus connected/disconnected status and iscell. Requires a SAN from telemarketing.donotcall.gov on the account.",
    ),
    fraudRisk: lookup(
      "RealPhoneValidationFraudChk.php",
      "Fraud Risk Score: score 0-1000 with risk_level and recommendation (allow, flag, block), phone type, carrier, location, time zone and number cleansing for calls and SMS. Documented as XML only, so the result may be { raw }.",
      { json: false },
    ),
    reassignedNumber: mutation(
      {
        description:
          "Reassigned Numbers: whether a number changed owners after the date you got consent. reassigned is yes, no, no_data (no carrier changes recorded since 2021-01-27) or undetermined (likely bad input). contactDate is YYYY-MM-DD. Billed per lookup; limit 10 calls per second.",
        input: object({ phone, contactDate: string({ minLength: 10 }) }),
        approval: always(),
      },
      async ({ fetch }, { phone, contactDate }) =>
        call(fetch, "ReassignedNumberLookup.php", { phone, contact_date: contactDate }),
    ),
    emailValidation: mutation(
      {
        description:
          "REV Lightning real-time email validation: retval (0 good, -1 or 102 error), reachable (Y/N/?), accept_all, disposable, free, isp and caution flags. Billed per lookup; limit 10 calls per second.",
        input: object({ email: string({ minLength: 3 }) }),
        approval: always(),
      },
      async ({ fetch }, { email }) => call(fetch, "RealEmailLightning.php", { email }),
    ),
  });
};

export default defineApp(
  { user: { accounts: { realphonevalidation: realphonevalidation.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.realphonevalidation ?? [], (account) => tools(account, signal), { signal }),
      {
        title: "RealPhoneValidation",
        description:
          "Validate US phone numbers and emails with RealPhoneValidation: connectivity, line type, carrier, Do Not Call and litigator status, fraud risk, reassigned numbers and email deliverability.",
        icons,
      },
    ),
  }),
);
