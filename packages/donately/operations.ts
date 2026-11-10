// Operations of the Donately REST API v2, from https://developer.donate.ly/api/ (Donately publishes no OpenAPI document).
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
};

const list = (extra: string) =>
  `Query parameters: account_id (act_..., required by most endpoints), limit (max 100), offset, sort (ASC or DESC), order_by${extra}.`;

export const operations: Operation[] = [
  { group: "accounts", name: "list", method: "GET", path: "/v2/accounts", description: "List the accounts the API token can access. Query parameters: limit, offset." },
  { group: "accounts", name: "get", method: "GET", path: "/v2/accounts/{id}", description: "Get an account by ID (act_...)." },
  { group: "accounts", name: "mine", method: "GET", path: "/v2/accounts/mine", description: "Get the account associated with the API token." },
  { group: "accounts", name: "create", method: "POST", path: "/v2/accounts", description: "Create a Donately account." },
  { group: "accounts", name: "update", method: "POST", path: "/v2/accounts/{id}", description: "Update an account's settings." },

  { group: "campaigns", name: "list", method: "GET", path: "/v2/campaigns", description: `List campaigns. ${list(", status (draft, published, archived), type (e.g. donation, peer_to_peer), keyword, has_fundraisers")}` },
  { group: "campaigns", name: "get", method: "GET", path: "/v2/campaigns/{id}", description: "Get a campaign by ID (cmp_...)." },
  { group: "campaigns", name: "create", method: "POST", path: "/v2/campaigns", description: "Create a campaign. Body includes account_id and title." },
  { group: "campaigns", name: "update", method: "POST", path: "/v2/campaigns/{id}", description: "Update a campaign." },
  { group: "campaigns", name: "delete", method: "DELETE", path: "/v2/campaigns/{id}", description: "Delete a campaign. This cannot be undone." },

  { group: "donations", name: "list", method: "GET", path: "/v2/donations", description: `List donations. ${list(", status (completed, pending, refunded, rejected), person_id, campaign_id, fundraiser_id, donation_type, recurring, anonymous, currency, keyword, amount_in_cents, created and updated date ranges as {gt, lt} timestamps")}` },
  { group: "donations", name: "get", method: "GET", path: "/v2/donations/{id}", description: "Get a donation by ID (dnt_...)." },
  { group: "donations", name: "create", method: "POST", path: "/v2/donations", description: "Create a donation. Body: account_id and amount_in_cents (required); campaign_id, fundraiser_id, first_name, last_name, email, currency, anonymous, comment, on_behalf_of, meta_data, donation_type, origin, notes, ecard." },
  { group: "donations", name: "update", method: "POST", path: "/v2/donations/{id}", description: "Update a donation record." },
  { group: "donations", name: "refund", method: "POST", path: "/v2/donations/{id}/refund", description: "Refund a donation through its original payment processor (Stripe or PayPal)." },
  { group: "donations", name: "sendReceipt", method: "POST", path: "/v2/donations/{id}/send_receipt", description: "Resend the donation receipt email to the donor." },

  { group: "subscriptions", name: "list", method: "GET", path: "/v2/subscriptions", description: `List recurring subscriptions. ${list("")}` },
  { group: "subscriptions", name: "get", method: "GET", path: "/v2/subscriptions/{id}", description: "Get a subscription by ID (sub_...)." },
  { group: "subscriptions", name: "update", method: "POST", path: "/v2/subscriptions/{id}", description: "Update a subscription's amount, frequency or payment method." },
  { group: "subscriptions", name: "runNow", method: "POST", path: "/v2/subscriptions/{id}/run_now", description: "Charge a recurring subscription immediately instead of waiting for its next scheduled date." },

  { group: "people", name: "list", method: "GET", path: "/v2/people", description: `List donors and contacts. ${list(", keyword (name or email)")}` },
  { group: "people", name: "get", method: "GET", path: "/v2/people/{id}", description: "Get a person by ID (per_...)." },
  { group: "people", name: "create", method: "POST", path: "/v2/people", description: "Create a person record." },
  { group: "people", name: "exists", method: "GET", path: "/v2/people/exists", description: "Check whether a person exists. Query parameters: account_id, email." },
  { group: "people", name: "taxReceipt", method: "GET", path: "/v2/people/tax_receipt", description: "Generate a tax receipt for a donor for a period. Query parameters: account_id, person_id and the period." },

  { group: "fundraisers", name: "list", method: "GET", path: "/v2/fundraisers", description: `List peer-to-peer fundraisers. ${list(", campaign_id")}` },
  { group: "fundraisers", name: "get", method: "GET", path: "/v2/fundraisers/{id}", description: "Get a fundraiser by ID (fun_...)." },

  { group: "forms", name: "list", method: "GET", path: "/v2/forms", description: `List donation forms. ${list("")}` },
  { group: "forms", name: "get", method: "GET", path: "/v2/forms/{id}", description: "Get a donation form by ID (frm_...)." },
  { group: "forms", name: "config", method: "GET", path: "/v2/forms/{id}/config", description: "Get the full configuration of a form, as used to render the embeddable donation form." },
  { group: "forms", name: "create", method: "POST", path: "/v2/forms", description: "Create a donation form configuration." },
  { group: "forms", name: "update", method: "POST", path: "/v2/forms/{id}", description: "Update a form's configuration." },
  { group: "forms", name: "makeDefault", method: "POST", path: "/v2/forms/{id}/make_form_default", description: "Set a form as the account's default form." },
  { group: "forms", name: "delete", method: "DELETE", path: "/v2/forms/{id}", description: "Delete a form. This cannot be undone." },

  { group: "webhooks", name: "list", method: "GET", path: "/v2/webhooks", description: "List the account's webhooks. Query parameters: account_id, limit, offset." },
  { group: "webhooks", name: "get", method: "GET", path: "/v2/webhooks/{id}", description: "Get a webhook by ID (hok_...)." },
  { group: "webhooks", name: "create", method: "POST", path: "/v2/webhooks", description: "Register a webhook URL to receive event notifications." },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/v2/webhooks/{id}", description: "Delete a webhook." },
];
