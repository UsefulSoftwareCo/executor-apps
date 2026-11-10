import type { OpenapiToolNamesOptions } from "apps/openapi";
import eligibilitySpec from "./specs/eligibility.json" with { type: "json" };
import benefitCheckSpec from "./specs/benefit-check.json" with { type: "json" };
import precheckSpec from "./specs/precheck.json" with { type: "json" };
import claimInquirySpec from "./specs/claim-inquiry.json" with { type: "json" };
import claimActionsSpec from "./specs/claim-actions.json" with { type: "json" };
import documentSearchSpec from "./specs/document-search.json" with { type: "json" };
import referralSpec from "./specs/referrals.json" with { type: "json" };
import priorAuthSpec from "./specs/prior-auth.json" with { type: "json" };
import dentalEligibilitySpec from "./specs/dental-eligibility.json" with { type: "json" };
import dentalPrecareSpec from "./specs/dental-precare.json" with { type: "json" };
import dentalClaimStatusSpec from "./specs/dental-claim-status.json" with { type: "json" };
import dentalClaimsSpec from "./specs/dental-claims.json" with { type: "json" };
import dentalAttachmentsSpec from "./specs/dental-attachments.json" with { type: "json" };

// Official OpenAPI documents from the Optum developer portal ("Download OpenAPI Spec" on each API's Overview page,
// https://developer.optum.com/optumreal-medical/ and https://developer.optum.com/optumreal-dental/), vendored in
// specs/ unchanged: the portal rate limits downloads and its document ids change with every revision.
// The specs list the sandbox origin; index.ts swaps in the production origin for production accounts.
const doc = (spec: unknown) => ({ document: spec as never });

const sandbox = "https://sandbox-apigw.optum.com";

const auth = {
  // Medical specs name the scheme oAuth (an OAuth 2 client-credentials token); dental specs name it bearerAuth.
  securitySchemes: {
    oAuth: { type: "http", scheme: "bearer" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    sandbox: [
      { scheme: "oAuth", field: "access_token", part: "value", prefix: "" },
      { scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" },
    ],
    production: [
      { scheme: "oAuth", field: "access_token", part: "value", prefix: "" },
      { scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

// Path prefix of the spec's `servers` entry, appended to the environment's origin.
const api = <const K extends Record<string, "query">>(source: { document: never }, prefix: string, kinds: K) =>
  ({ source, allowedOrigin: sandbox, baseUrl: `${sandbox}${prefix}`, prefix, ...auth, kinds }) satisfies OpenapiToolNamesOptions & { prefix: string };

// Most POST operations are lookups (eligibility, status, search), so kinds=query runs them without an approval prompt.
export const eligibilityOptions = api(doc(eligibilitySpec), "/oihub", { checkEligibility: "query" });
export const benefitCheckOptions = api(doc(benefitCheckSpec), "", { benefitCheck: "query" });
export const precheckOptions = api(doc(precheckSpec), "/oihub", { claimPreCheck: "query" });
export const claimInquiryOptions = api(doc(claimInquirySpec), "", { claimInquiry: "query" });
export const claimActionsOptions = api(doc(claimActionsSpec), "", {});
export const documentSearchOptions = api(doc(documentSearchSpec), "", { documentSearch: "query" });
export const referralOptions = api(doc(referralSpec), "", {});
export const priorAuthOptions = api(doc(priorAuthSpec), "", {
  getNextQuestion: "query",
  getQuestionnairePackage: "query",
  inquireClaim: "query",
});
export const dentalEligibilityOptions = api(doc(dentalEligibilitySpec), "", { checkEligibility: "query" });
export const dentalPrecareOptions = api(doc(dentalPrecareSpec), "/oihub/dental", { dentalClaimPrecheck: "query" });
export const dentalClaimStatusOptions = api(doc(dentalClaimStatusSpec), "", { claimStatus: "query" });
export const dentalClaimsOptions = api(doc(dentalClaimsSpec), "", {});
export const dentalAttachmentsOptions = api(doc(dentalAttachmentsSpec), "/dental/attachments/v1", {
  searchAttachments: "query",
});

// Every API by its router key.
export const apis = {
  eligibility: eligibilityOptions,
  benefitCheck: benefitCheckOptions,
  precheck: precheckOptions,
  claimInquiry: claimInquiryOptions,
  claimActions: claimActionsOptions,
  documentSearch: documentSearchOptions,
  referrals: referralOptions,
  priorAuth: priorAuthOptions,
  dentalEligibility: dentalEligibilityOptions,
  dentalPrecare: dentalPrecareOptions,
  dentalClaimStatus: dentalClaimStatusOptions,
  dentalClaims: dentalClaimsOptions,
  dentalAttachments: dentalAttachmentsOptions,
} as const;

// scripts/tools.ts reads `options`; Pre-Service Eligibility is the main API.
export const options = eligibilityOptions;
