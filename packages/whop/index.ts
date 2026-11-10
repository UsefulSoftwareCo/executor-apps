import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Account = object({ id: string(), title: string() });
const Userinfo = object({ sub: string() });

// Resource scopes: every scope in the spec's per-operation security requirements that
// Whop's discovery document advertises (the spec also names 22 that discovery omits, which
// are left out so the authorize request is not rejected as invalid_scope). The three OIDC
// scopes make /oauth/userinfo return `sub` for the health check.
const scopes = [
  "openid",
  "profile",
  "email",
  "access_pass:basic:read",
  "access_pass:create",
  "access_pass:delete",
  "access_pass:update",
  "ad_campaign:basic:read",
  "ad_campaign:create",
  "ad_campaign:update",
  "ad_pixel:manage",
  "affiliate:basic:read",
  "affiliate:create",
  "affiliate:update",
  "ai_chat:create",
  "ai_chat:delete",
  "ai_chat:update",
  "audience:basic:read",
  "audience:update",
  "bounty:basic:read",
  "bounty:create",
  "bounty:submission:create",
  "bounty:submission:delete",
  "bounty:update",
  "chat:message:create",
  "chat:moderate",
  "chat:read",
  "checkout_configuration:basic:read",
  "checkout_configuration:create",
  "checkout_configuration:delete",
  "company:authorized_user:read",
  "company:balance:export",
  "company:balance:read",
  "company:basic:read",
  "company:create",
  "company:manage_checkout",
  "company:update",
  "company_token_transaction:create",
  "company_token_transaction:read",
  "course_analytics:read",
  "courses:read",
  "courses:update",
  "crypto_wallet:swap",
  "crypto_wallet:trade",
  "crypto_wallet:trade:read",
  "developer:basic:read",
  "developer:create_app",
  "developer:logs:read",
  "developer:manage_builds",
  "developer:update_app",
  "dms:channel:manage",
  "dms:message:manage",
  "dms:read",
  "domain:manage",
  "domain:read",
  "event:create",
  "experience:attach",
  "experience:create",
  "experience:delete",
  "experience:detach",
  "experience:update",
  "forum:moderate",
  "forum:post:create",
  "forum:read",
  "identity:read",
  "identity:write",
  "incorporation:write",
  "invoice:basic:read",
  "invoice:create",
  "invoice:update",
  "lead:basic:read",
  "lead:manage",
  "livestream:chat:read",
  "livestream:chat:write",
  "media:generate",
  "media:read",
  "member:basic:read",
  "member:email:read",
  "member:journey:read",
  "member:manage",
  "member:payment_methods:manage",
  "member:payment_methods:read",
  "membership:cancel",
  "membership:resync_access",
  "membership:transfer",
  "membership:update",
  "notification:create",
  "partner:basic:read",
  "partner:create",
  "partner:fees:update",
  "partner:referral_request:accept",
  "partner:referral_request:cancel",
  "partner:referral_request:create",
  "partner:referral_request:decline",
  "partner:referral_request:read",
  "payment:basic:read",
  "payment:charge",
  "payment:dispute",
  "payment:dispute:read",
  "payment:dispute_alert:read",
  "payment:manage",
  "payment:resolution_center",
  "payment:resolution_center_case:manage",
  "payment:resolution_center_case:read",
  "payment:setup_intent:read",
  "payout:account:read",
  "payout:account:update",
  "payout:create_destination",
  "payout:delete_destination",
  "payout:destination:read",
  "payout:transfer:read",
  "payout:transfer_funds",
  "payout:update_destination",
  "payout:withdraw_funds",
  "payout:withdrawal:read",
  "plan:basic:read",
  "plan:create",
  "plan:delete",
  "plan:update",
  "plan:waitlist:export",
  "promo_code:basic:export",
  "promo_code:basic:read",
  "promo_code:create",
  "promo_code:delete",
  "promo_code:update",
  "referral:basic:read",
  "shipment:basic:read",
  "shipment:create",
  "social_account:create",
  "social_account:delete",
  "social_account:read",
  "stats:read",
  "support_chat:create",
  "support_chat:message:create",
  "support_chat:read",
  "tracking_link:basic:export",
  "user:balance:read",
  "user:notifications:read",
  "user:notifications:update",
  "user:profile:update",
];

const whop = defineProvider({
  name: "Whop",
  hosts: ["api.whop.com"],
  auth: {
    apiKey: secrets({
      label: "Company API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Whop publishes OIDC metadata; the connect page asks for your OAuth app's client.
    oauth: oauth2({
      discover: "https://api.whop.com",
      scopes,
      // Whop documents JSON bodies for /oauth/token and /oauth/refresh. Its discovery
      // document advertises none, client_secret_basic and client_secret_post; the
      // connect page collects a client secret, so send it in the body.
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch("https://api.whop.com/oauth/userinfo", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
      const me = await decodeJson(response, Userinfo);
      return { accountInfo: { externalId: me.sub } };
    }
    const response = await fetch("https://api.whop.com/api/v1/accounts/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: me.id, displayName: me.title } };
  },
});

export default defineApp(
  { user: { accounts: { whop: whop.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.whop ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Whop",
        description:
          "Products, plans, memberships, payments, payouts, courses, chat, ads and the rest of the Whop API.",
        icons,
      },
    ),
  }),
);
