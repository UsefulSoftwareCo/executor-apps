import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Zoho Books runs in nine data centers, each with its own accounts server and API host.
// The published definition names only the US host; index.ts pins the account's own data center as the
// only origin that receives credentials.
export const regions = {
  us: { accounts: "https://accounts.zoho.com", api: "https://www.zohoapis.com" },
  eu: { accounts: "https://accounts.zoho.eu", api: "https://www.zohoapis.eu" },
  in: { accounts: "https://accounts.zoho.in", api: "https://www.zohoapis.in" },
  au: { accounts: "https://accounts.zoho.com.au", api: "https://www.zohoapis.com.au" },
  jp: { accounts: "https://accounts.zoho.jp", api: "https://www.zohoapis.jp" },
  ca: { accounts: "https://accounts.zohocloud.ca", api: "https://www.zohoapis.ca" },
  sa: { accounts: "https://accounts.zoho.sa", api: "https://www.zohoapis.sa" },
  ae: { accounts: "https://accounts.zoho.ae", api: "https://www.zohoapis.ae" },
  cn: { accounts: "https://accounts.zoho.com.cn", api: "https://www.zohoapis.com.cn" },
} as const;

export type Region = keyof typeof regions;

// Zoho sends the OAuth token as `Authorization: Zoho-oauthtoken <token>`; generate.py declares that
// header as the Zoho_Auth scheme on every operation.
const bearer = [{ scheme: "Zoho_Auth", field: "access_token", part: "value" as const, prefix: "Zoho-oauthtoken " }];

export const options = {
  source: { document: document as never },
  allowedOrigin: regions.us.api,
  baseUrl: `${regions.us.api}/books/v3`,
  securitySchemes: { Zoho_Auth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    oauthUs: bearer,
    oauthEu: bearer,
    oauthIn: bearer,
    oauthAu: bearer,
    oauthJp: bearer,
    oauthCa: bearer,
    oauthSa: bearer,
    oauthAe: bearer,
    oauthCn: bearer,
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
