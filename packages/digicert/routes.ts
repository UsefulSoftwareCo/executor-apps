// [group, name, method, path, pathParams, queryParams, description, kind]
// kind: "list" adds filters/sort/limit/offset; "body" takes a JSON payload; "none" takes nothing extra.
export type Method = "GET" | "POST" | "PUT" | "DELETE";
export type Kind = "list" | "body" | "optionalBody" | "none";
export type Route = readonly [
  group: string,
  name: string,
  method: Method,
  path: string,
  pathParams: readonly string[],
  queryParams: readonly string[],
  description: string,
  kind: Kind,
];

const formats =
  "format is one of default, apache, default_cer, cer, p7b, default_pem, pem_all, pem_nointermediate, pem_noroot. Zip formats come back base64-encoded.";

export const routes: readonly Route[] = [
  ["account", "me", "GET", "/user/me", [], [], "The user that owns the API key (id, username, account_id, access roles, container). Use it to confirm the key works.", "none"],
  ["account", "details", "GET", "/account", [], [], "Account details: id, pricing model, certificate transparency setting, CertCentral type and account manager.", "none"],
  ["account", "listCustomFields", "GET", "/account/metadata", [], [], "List the account's custom order fields (metadata_id, label, required).", "none"],

  ["orders", "list", "GET", "/order/certificate", [], [], "List certificate orders. filters keys: id, status (pending, issued, rejected, revoked, waiting_pickup, reissue_pending, canceled, active_issued), organization_id, product_name_id, valid_till, user_id, common_name, domain_name, date_created, container_id, metadata_id, is_renewed, email, certificate_id, serial_number, search (prefix %25 for contains). sort example: -date_created. limit max 5000.", "list"],
  ["orders", "get", "GET", "/order/certificate/{order_id}", ["order_id"], ["include_caa_status"], "Full details of one order: certificate, status, organization, contacts, validity, DCV state. order_id may also be the primary certificate's serial number or thumbprint. include_caa_status=true adds CAA check results for pending orders.", "none"],
  ["orders", "validationStatus", "GET", "/order/certificate/{order_id}/validation", ["order_id"], ["include_risk_check"], "Validation progress of an order: organization and domain validation status per name.", "none"],
  ["orders", "listReissues", "GET", "/order/certificate/{order_id}/reissue", ["order_id"], [], "List the reissued certificates of an order.", "none"],
  ["orders", "listDuplicates", "GET", "/order/certificate/{order_id}/duplicate", ["order_id"], [], "List the duplicate certificates of an order.", "none"],
  ["orders", "listNotes", "GET", "/order/certificate/{order_id}/note", ["order_id"], [], "List the notes on an order.", "none"],
  ["orders", "statusChanges", "GET", "/order/certificate/status-changes", [], ["minutes", "seconds"], "Orders whose status changed recently. Pass minutes (max 10080) and/or seconds, or filters.status_last_updated as start...end for older ranges. At least one is required.", "list"],
  ["orders", "order", "POST", "/order/certificate/{product_name_id}", ["product_name_id"], [], "Place a certificate order. product_name_id is a product from products.list (for example ssl_basic, ssl_plus, ssl_wildcard, ssl_ev_plus, client_premium_sponsor, code_signing). body is the order payload: certificate {common_name, dns_names, csr, signature_hash, server_platform}, order_validity {years or days}, organization {id}, payment_method, dcv_method, skip_approval and more; fields differ per product, see https://dev.digicert.com/en/certcentral-apis/services-api/orders.html. This spends account balance.", "body"],
  ["orders", "reissue", "POST", "/order/certificate/{order_id}/reissue", ["order_id"], [], "Reissue the certificate of an order with a new CSR. body: certificate {csr, common_name, dns_names, signature_hash, server_platform}, dcv_method, comments, skip_approval.", "body"],
  ["orders", "duplicate", "POST", "/order/certificate/{order_id}/duplicate", ["order_id"], [], "Issue a duplicate certificate on an order. body: certificate {common_name, dns_names, csr, signature_hash, server_platform}, custom_expiration_date.", "body"],
  ["orders", "addNote", "POST", "/order/certificate/{order_id}/note", ["order_id"], [], "Add a note to an order. body: {text}.", "body"],
  ["orders", "updateStatus", "PUT", "/order/certificate/{order_id}/status", ["order_id"], [], "Change an order's status. body: {status: canceled | renewed | not_renewed, note}. note is required when canceling.", "body"],
  ["orders", "revoke", "PUT", "/order/certificate/{order_id}/revoke", ["order_id"], [], "Revoke every certificate on an order. Permanent. body (all optional): revocation_reason (unspecified, keyCompromise, affiliationChanged, superseded, cessationOfOperation), comments (DigiCert's docs name this field comment in the parameter table but send comments in the example; add both if unsure), skip_approval (admin keys only).", "optionalBody"],
  ["orders", "delete", "DELETE", "/order/certificate/{order_id}", ["order_id"], ["revoke"], "Delete an eligible inactive order. revoke=true also revokes the certificate. Permanent.", "none"],
  ["orders", "checkDcv", "PUT", "/order/certificate/{order_id}/check-dcv", ["order_id"], [], "Trigger a DCV check on a pending DV order using dns-txt-token, dns-cname-token or http-token. body optional: {dns_name_validations: [{dns_name, dcv_method}]}; without it every domain is checked.", "optionalBody"],

  ["certificates", "download", "GET", "/certificate/{certificate_id}/download/format/{format}", ["certificate_id", "format"], [], `Download an issued certificate by certificate id. ${formats}`, "none"],
  ["certificates", "downloadForOrder", "GET", "/certificate/download/order/{order_id}/format/{format}", ["order_id", "format"], [], `Download the active certificate of an order. ${formats}`, "none"],
  ["certificates", "chain", "GET", "/certificate/{certificate_id}/chain", ["certificate_id"], [], "The intermediate and root chain of a certificate.", "none"],
  ["certificates", "listIntermediates", "GET", "/certificate/intermediates", [], [], "List the intermediate certificates available to the account, with PEM.", "none"],
  ["certificates", "listNotes", "GET", "/certificate/{certificate_id}/note", ["certificate_id"], [], "List the notes on a certificate.", "none"],
  ["certificates", "addNote", "POST", "/certificate/{certificate_id}/note", ["certificate_id"], [], "Add a note to a certificate. body: {text}.", "body"],
  ["certificates", "revoke", "PUT", "/certificate/{certificate_id}/revoke", ["certificate_id"], [], "Revoke one certificate (id or serial number). Permanent. body (all optional): revocation_reason (unspecified, keyCompromise, affiliationChanged, superseded, cessationOfOperation), comments (DigiCert's docs name this field comment in the parameter table but send comments in the example; add both if unsure), skip_approval (admin keys only).", "optionalBody"],
  ["certificates", "email", "PUT", "/certificate/{certificate_id}/sendemail", ["certificate_id"], [], "Email a certificate. body: {emails: [address], certificate_collect_format: attachment | plaintext | downloadlink, custom_message}.", "body"],

  ["domains", "list", "GET", "/domain", [], ["include_dcv_expiration_time"], "List domains in the account. filters keys: status (active, inactive), validation (completed, ov_expired, ev_expired, ov_expiring, ev_expiring and 7/30/60/90 day windows), dcv_method, search, search_criteria (exact, partial), include_validation_reuse_status. sort example: -date_created.", "list"],
  ["domains", "get", "GET", "/domain/{domain_id}", ["domain_id"], ["include_dcv", "include_validation", "include_validation_reuse_status"], "One domain with organization, container and optionally DCV and validation details.", "none"],
  ["domains", "validationDetails", "GET", "/domain/{domain_id}/validation", ["domain_id"], [], "Validation status of a domain per validation type.", "none"],
  ["domains", "listDcvMethods", "GET", "/domain/dcv/method", [], [], "List the domain control validation methods the account supports.", "none"],
  ["domains", "emails", "GET", "/domain/{domain_id}/dcv/emails", ["domain_id"], ["consider_dcv_email_preferences"], "Email addresses that can receive a DCV email for a domain (domain_id may be the FQDN).", "none"],
  ["domains", "add", "POST", "/domain", [], [], "Add a domain. body: {name, organization: {id}, validations: [{type: ov | ev}], dcv_method, email_array}.", "body"],
  ["domains", "submitForValidation", "POST", "/domain/{domain_id}/validation", ["domain_id"], [], "Submit a domain for validation. body: {validations: [{type}], dcv_method, email_array}. With a token dcv_method the response carries dcv_token.", "body"],
  ["domains", "changeDcvMethod", "PUT", "/domain/{domain_id}/dcv/method", ["domain_id"], [], "Change a domain's DCV method. body: {dcv_method: email | dns-txt-token | dns-cname-token | http-token | persistent-txt, send_dcv_email_flag, email_array}.", "body"],
  ["domains", "checkDcv", "PUT", "/domain/{domain_id}/dcv/validate-token", ["domain_id"], [], "Check the DNS or file token for a domain using a token DCV method. Returns {status: active} on success.", "none"],
  ["domains", "resendDcvEmail", "PUT", "/domain/{domain_id}/dcv/emails", ["domain_id"], [], "Resend the DCV emails. body optional: {name_scope, email_array}.", "optionalBody"],
  ["domains", "activate", "PUT", "/domain/{domain_id}/activate", ["domain_id"], [], "Re-enable a deactivated domain.", "none"],
  ["domains", "deactivate", "PUT", "/domain/{domain_id}/deactivate", ["domain_id"], [], "Deactivate a domain.", "none"],
  ["domains", "delete", "DELETE", "/domain/{domain_id}", ["domain_id"], [], "Delete a domain. Existing certificates keep working; new ones may need revalidation.", "none"],

  ["organizations", "list", "GET", "/organization", [], ["include_validation"], "List organizations. filters keys: status (active, inactive), validation (pending, not_pending), container_id_for_organization, search (id or name substring).", "list"],
  ["organizations", "get", "GET", "/organization/{organization_id}", ["organization_id"], [], "One organization with address and contacts.", "none"],
  ["organizations", "validationDetails", "GET", "/organization/{organization_id}/validation", ["organization_id"], [], "Approved validation types of an organization (ov, ev, cs, ev_cs, ds, smime) with expiry.", "none"],
  ["organizations", "listApprovers", "GET", "/organization/potential-approvers", [], [], "List users and contacts eligible to be verified contacts (EV approvers) for EV and code signing validation.", "none"],
  ["organizations", "create", "POST", "/organization", [], [], "Create an organization. body: {name, country, address, city, state (full name), zip, telephone, organization_contact: {first_name, last_name, email}, validations: [{type}]}. Returns the new id.", "body"],
  ["organizations", "submitForValidation", "POST", "/organization/{organization_id}/validation", ["organization_id"], [], "Submit an organization for validation. body: {validations: [{type: ov | ev | cs | ev_cs | ds | smime, verified_users: [{id}]}]}.", "body"],
  ["organizations", "activate", "PUT", "/organization/{organization_id}/activate", ["organization_id"], [], "Activate an organization.", "none"],
  ["organizations", "deactivate", "PUT", "/organization/{organization_id}/deactivate", ["organization_id"], [], "Deactivate an organization.", "none"],

  ["users", "list", "GET", "/user", [], ["container_id", "access_role_id", "without_container"], "List users. filters keys: status, search (username, name or email; prefix %25 for contains).", "list"],
  ["users", "get", "GET", "/user/{user_id}", ["user_id"], [], "One user by id (or me).", "none"],
  ["users", "listServiceUsers", "GET", "/user/api-only", [], ["container_id", "access_role_id", "without_container"], "List service users.", "list"],

  ["containers", "list", "GET", "/container", [], [], "List containers (divisions) in the account.", "none"],
  ["containers", "get", "GET", "/container/{container_id}", ["container_id"], [], "One container.", "none"],
  ["containers", "listChildren", "GET", "/container/{container_id}/children", ["container_id"], [], "List the child containers of a container.", "none"],
  ["containers", "productLimits", "GET", "/container/{container_id}/product-limits", ["container_id"], [], "Product validity limits for a container.", "none"],

  ["products", "list", "GET", "/product", [], [], "List products the account can order (name_id, name, type, allowed validity).", "none"],
  ["products", "get", "GET", "/product/{name_id}", ["name_id"], ["container_id"], "One product: allowed hashes, validity, server platforms and required fields.", "none"],
  ["products", "pricing", "GET", "/product/pricing", [], [], "Pricing list for the account.", "none"],
  ["products", "certFormatMap", "GET", "/product/platform-certformat-mapping", [], [], "Map of server platforms to certificate formats.", "none"],

  ["reports", "requestSummary", "GET", "/report/request", [], ["container_id"], "Summary of certificate requests awaiting approval.", "none"],
  ["reports", "expiring", "GET", "/report/order/expiring", [], ["container_id", "include_expiring_certs"], "Orders and certificates that are about to expire.", "none"],

  ["finance", "balance", "GET", "/finance/balance", [], ["container_id"], "Account balance and credit.", "none"],
] as const;
