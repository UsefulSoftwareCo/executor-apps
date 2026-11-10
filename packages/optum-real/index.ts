import { ProviderError, accountRouter, defineApp, defineProvider, oauth2, router, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const origins = { sandbox: "https://sandbox-apigw.optum.com", production: "https://apigw.optum.com" } as const;

const optum = defineProvider({
  name: "Optum Real",
  hosts: ["sandbox-apigw.optum.com", "apigw.optum.com"],
  auth: {
    // Client ID and secret of an application on the Optum developer portal, exchanged for a bearer token.
    sandbox: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origins.sandbox}/apip/auth/sntl/v1/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
    production: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origins.production}/apip/auth/sntl/v1/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
  },
  // Calls a read-only, unauthenticated-data health endpoint the Optum specs document (dental eligibility
  // pre-service healthcheck) with the account's bearer token; the body is ignored, so only the status counts.
  async health({ account, fetch, signal }) {
    const origin = origins[account.method];
    const response = await fetch(`${origin}/oihub/dental/eligibility/preservice/v1/healthcheck`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    if (response.status === 401 || response.status === 403) throw new ProviderError({ reason: "unauthorized", status: response.status });
    if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
    return { accountInfo: { externalId: `optum-real-${account.method}`, displayName: `Optum Real (${account.method})` } };
  },
});

export default defineApp(
  { user: { accounts: { optum: optum.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.optum ?? [],
        (account) => {
          const origin = origins[account.method];
          const mount = (key: keyof typeof apis) => {
            const { prefix, ...options } = apis[key];
            return withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}${prefix}`, cache, fetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          };
          return router(
            {
              eligibility: mount("eligibility"),
              benefitCheck: mount("benefitCheck"),
              precheck: mount("precheck"),
              claimInquiry: mount("claimInquiry"),
              claimActions: mount("claimActions"),
              documentSearch: mount("documentSearch"),
              referrals: mount("referrals"),
              priorAuth: mount("priorAuth"),
              dentalEligibility: mount("dentalEligibility"),
              dentalPrecare: mount("dentalPrecare"),
              dentalClaimStatus: mount("dentalClaimStatus"),
              dentalClaims: mount("dentalClaims"),
              dentalAttachments: mount("dentalAttachments"),
            },
            { title: "Optum Real", description: "Optum Real medical and dental APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Optum Real",
        description:
          "Optum Real healthcare payer-provider APIs. Medical: pre-service eligibility, patient benefit check, claim pre-check, claim inquiry and actions, document search, authorization and referral submission, FHIR prior authorization. Dental: pre-care eligibility and estimates, claim submission and status, attachments.",
        instructions:
          "Pick the sandbox account while testing (canned data, no PHI); production accounts return real member data. Payloads are payer-specific, so read each tool's input schema.",
        icons,
      },
    ),
  }),
);
