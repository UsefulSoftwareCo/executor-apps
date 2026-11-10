import type { OpenapiToolNamesOptions } from "apps/openapi";

// Twilio SendGrid publishes one OpenAPI document per product area in twilio/sendgrid-oai.
// They share one host and one bearer API key, so each becomes a router under its own key.
// Pinned to a commit of twilio/sendgrid-oai (2026-03-24) so the documents cannot change underneath the package.
const commit = "fb95a935c87b79f7f982ac34bd37adab1f697dbc";
const base = `https://raw.githubusercontent.com/twilio/sendgrid-oai/${commit}/spec/json`;
const document = (file: string) =>
  ({
    source: { url: `${base}/${file}.json` },
    allowedOrigin: "https://api.sendgrid.com",
    baseUrl: "https://api.sendgrid.com",
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const files = [
  "tsg_account_provisioning_v3",
  "tsg_alerts_v3",
  "tsg_api_keys_v3",
  "tsg_domain_authentication_v3",
  "tsg_email_activity_v3",
  "tsg_email_validation_v3",
  "tsg_enforced_tls_v3",
  "tsg_integrations_v3",
  "tsg_ip_access_management_v3",
  "tsg_ip_address_management_v3",
  "tsg_ip_provisioning_v3",
  "tsg_ip_warmup_v3",
  "tsg_ips_v3",
  "tsg_link_branding_v3",
  "tsg_lmc_campaigns_v3",
  "tsg_lmc_contactdb_v3",
  "tsg_lmc_senders_v3",
  "tsg_logs_v3",
  "tsg_mail_settings_v3",
  "tsg_mail_v3",
  "tsg_mc_contacts_v3",
  "tsg_mc_custom_fields_v3",
  "tsg_mc_designs_v3",
  "tsg_mc_lists_v3",
  "tsg_mc_segments_2.0_v3",
  "tsg_mc_segments_v3",
  "tsg_mc_senders_v3",
  "tsg_mc_singlesends_v3",
  "tsg_mc_stats_v3",
  "tsg_mc_test_v3",
  "tsg_partner_v3",
  "tsg_recipients_data_erasure_v3",
  "tsg_reverse_dns_v3",
  "tsg_scheduled_sends_v3",
  "tsg_scopes_v3",
  "tsg_seq_v3",
  "tsg_sso_v3",
  "tsg_stats_v3",
  "tsg_subusers_v3",
  "tsg_suppressions_v3",
  "tsg_teammates_v3",
  "tsg_templates_v3",
  "tsg_tracking_settings_v3",
  "tsg_user_v3",
  "tsg_verified_senders_v3",
  "tsg_webhooks_v3",
] as const;

// Router key: the file name without the "tsg_" prefix and "_v3" suffix, camel-cased.
export const key = (file: string) =>
  file
    .replace(/^tsg_/, "")
    .replace(/_v3$/, "")
    .replace(/[._]+([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export const specs = Object.fromEntries(files.map((file) => [key(file), document(file)]));
export const options = document("tsg_mail_v3");
