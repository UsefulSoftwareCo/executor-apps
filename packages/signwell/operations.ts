export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

// SignWell API v1 (https://developers.signwell.com/reference), one entry per documented endpoint.
export const operations: Operation[] = [
  { group: "account", name: "me", method: "GET", path: "/me", description: "Get the account and user the API key belongs to." },
  { group: "documents", name: "get", method: "GET", path: "/documents/{id}", description: "Get a document with its recipients, fields and status." },
  { group: "documents", name: "create", method: "POST", path: "/documents", description: "Create and optionally send a document. Body: files (each {name, file_base64} or {name, file_url}), recipients (each {id, name, email}) required; optional name, subject, message, draft, test_mode, fields, text_tags, expires_in, reminders, apply_signing_order, embedded_signing, redirect_url, metadata and more." },
  { group: "documents", name: "createFromTemplate", method: "POST", path: "/document_templates/documents", description: "Create and optionally send a document from one or more templates. Body: template_id or template_ids, recipients (each {id, name, email, placeholder_name}) required; optional name, subject, message, draft, test_mode, template_fields, metadata and more." },
  { group: "documents", name: "send", method: "POST", path: "/documents/{id}/send", description: "Send a draft document to its recipients. Optional body overrides such as subject, message, expires_in, reminders." },
  { group: "documents", name: "remind", method: "POST", path: "/documents/{id}/remind", description: "Send a reminder to recipients who have not signed. Optional body: recipients (list of {id, name, email})." },
  { group: "documents", name: "updateAuthentication", method: "PATCH", path: "/documents/{id}/authentication", description: "Update passcode delivery settings for recipients who have not started signing. Body: recipients." },
  { group: "documents", name: "updateRecipients", method: "PATCH", path: "/documents/{id}/recipients", description: "Update recipients of a sent document who have not started signing. Body: recipients (ids come from get). " },
  { group: "documents", name: "delete", method: "DELETE", path: "/documents/{id}", description: "Delete a document, cancelling signing if in progress." },
  { group: "documents", name: "completedPdf", method: "GET", path: "/documents/{id}/completed_pdf", description: "Get the completed document PDF or ZIP. Query: url_only (true returns a download URL as JSON), audit_page, file_format. With url_only=false (default) the binary file is returned as {contentType, encoding: \"base64\", content}; prefer url_only=true for large files." },
  { group: "documents", name: "nom151Certificate", method: "GET", path: "/documents/{id}/nom151_certificate", description: "Get the NOM-151 certificate of a completed document (Mexico). Query: url_only, object_only. With url_only=false (default) the ZIP is returned as {contentType, encoding: \"base64\", content}; prefer url_only=true." },
  { group: "templates", name: "get", method: "GET", path: "/document_templates/{id}", description: "Get a template with its placeholders and fields." },
  { group: "templates", name: "create", method: "POST", path: "/document_templates", description: "Create a template. Body: files and placeholders required; optional name, subject, message, draft, fields, text_tags, and more." },
  { group: "templates", name: "update", method: "PUT", path: "/document_templates/{id}", description: "Update a template's name, subject, message, expiry, reminders and other settings." },
  { group: "templates", name: "delete", method: "DELETE", path: "/document_templates/{id}", description: "Delete a template." },
  { group: "bulkSends", name: "list", method: "GET", path: "/bulk_sends", description: "List bulk sends. Query: user_email, limit, page, api_application_id." },
  { group: "bulkSends", name: "get", method: "GET", path: "/bulk_sends/{id}", description: "Get a bulk send." },
  { group: "bulkSends", name: "documents", method: "GET", path: "/bulk_sends/{id}/documents", description: "List documents created by a bulk send. Query: limit, page." },
  { group: "bulkSends", name: "csvTemplate", method: "GET", path: "/bulk_sends/csv_template", description: "Get a blank bulk send CSV for template ids. Query: \"template_ids[]\" (array of ids), base64." },
  { group: "bulkSends", name: "validateCsv", method: "POST", path: "/bulk_sends/validate_csv", description: "Validate a bulk send CSV before creating the bulk send. Body: template_ids, bulk_send_csv (base64)." },
  { group: "bulkSends", name: "create", method: "POST", path: "/bulk_sends", description: "Create a bulk send. Body: template_ids, bulk_send_csv (base64) required; optional skip_row_errors, name, subject, message, apply_signing_order, api_application_id." },
  { group: "apiApplications", name: "get", method: "GET", path: "/api_applications/{id}", description: "Get an API application." },
  { group: "apiApplications", name: "delete", method: "DELETE", path: "/api_applications/{id}", description: "Delete an API application." },
  { group: "webhooks", name: "list", method: "GET", path: "/hooks", description: "List registered webhooks." },
  { group: "webhooks", name: "create", method: "POST", path: "/hooks", description: "Register a webhook. Body: callback_url (required), api_application_id." },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/hooks/{id}", description: "Delete a webhook." },
];
