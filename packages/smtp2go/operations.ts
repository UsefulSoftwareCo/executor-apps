export type Operation = { group: string; name: string; method: "POST" | "PATCH"; path: string; readonly: boolean; description: string };

export const operations: Operation[] = [
  {
    "group": "singleSenderEmails",
    "name": "add",
    "method": "POST",
    "path": "/single_sender_emails/add",
    "readonly": false,
    "description": "Use the API to add a single sender email address to your account, to use from which to send mail. If the email address has previously been added and not yet verified, this action will simply resend the verification email. Body fields (* required): email_address*, message, subaccount_id."
  },
  {
    "group": "suppression",
    "name": "add",
    "method": "POST",
    "path": "/suppression/add",
    "readonly": false,
    "description": "Suppresses the specified email address or domain Body fields (* required): email_address*, block_description, subaccount_id."
  },
  {
    "group": "allowedRecipients",
    "name": "add",
    "method": "POST",
    "path": "/allowed_recipients/add",
    "readonly": false,
    "description": "Add one or more email addresses and domain names to your Allowed Recipients List. Further details of the associated setting are found in the SMTP2GO Guides. Body fields (* required): allowed_recipients*, enabled, subaccount_id."
  },
  {
    "group": "allowedSenders",
    "name": "add",
    "method": "POST",
    "path": "/allowed_senders/add",
    "readonly": false,
    "description": "Add one or more email addresses and domain names to your Allowed or Restricted Senders List. How this list of email addresses and domain names are used is shown by the current 'mode' value; if the Restrict Senders setting is on, they will form either a whitelist or blacklist. If the setting is off, the list will be disabled. Further details of the associated setting are found in the SMTP2GO Guides. Details of how... Body fields (* required): allowed_senders*, subaccount_id."
  },
  {
    "group": "template",
    "name": "add",
    "method": "POST",
    "path": "/template/add",
    "readonly": false,
    "description": "Adds a new email template that you can use to format your emails. Body fields (* required): template_name*, id*, subject*, html_body*, text_body*, template_variables, tags."
  },
  {
    "group": "smtpUsers",
    "name": "add",
    "method": "POST",
    "path": "/users/smtp/add",
    "readonly": false,
    "description": "Add a new SMTP user to your account. Full details of the available options for new user accounts can be found in the SMTP User Guide. Body fields (* required): username*, email_password, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_domain, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, subaccount_id."
  },
  {
    "group": "apiKeys",
    "name": "add",
    "method": "POST",
    "path": "/api_keys/add",
    "readonly": false,
    "description": "Add a new API key to your account This endpoint is rate-limited to 5 requests per minute. Body fields (* required): description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, endpoints, subaccount_id."
  },
  {
    "group": "domain",
    "name": "add",
    "method": "POST",
    "path": "/domain/add",
    "readonly": false,
    "description": "Add a sender domain to your account. Note that you must own any domains you wish to include in this list, as you will be required to verify and authenticate the emails sent via that domain. Find full details in the Sender Domains Guide. Body fields (* required): domain*, tracking_subdomain, returnpath_subdomain, auto_verify, requisition_ssl, subaccount_id, subaccount_access."
  },
  {
    "group": "subaccount",
    "name": "add",
    "method": "POST",
    "path": "/subaccount/add",
    "readonly": false,
    "description": "Adds a new subaccount on your master account. Note: This end-point is rate limited to 50 calls per hour. Body fields (* required): fullname*, subaccount_email, limit, dedicated_ip, archiving, enforce_2fa, enable_sms, sms_limit."
  },
  {
    "group": "webhook",
    "name": "add",
    "method": "POST",
    "path": "/webhook/add",
    "readonly": false,
    "description": "Add a new webhook with the given configuration. Setup of webhooks can be done on the Settings > Webhooks page in your SMTP2GO control panel. Body fields (* required): url*, events, sms_events, headers, usernames, output_format, subaccount_id, auth_header_type, auth_header_value."
  },
  {
    "group": "subaccount",
    "name": "close",
    "method": "POST",
    "path": "/subaccount/close",
    "readonly": false,
    "description": "Changes the status of an Active subaccount to Closed Body fields (* required): id*, email."
  },
  {
    "group": "smtpUsers",
    "name": "edit",
    "method": "POST",
    "path": "/users/smtp/edit",
    "readonly": false,
    "description": "Update an SMTP user's details with the parameters passed. Full details of the available options for SMTP user accounts is found in the SMTP User Guide. Body fields (* required): username*, email_password, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_domain, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, subaccount_id."
  },
  {
    "group": "apiKeys",
    "name": "edit",
    "method": "POST",
    "path": "/api_keys/edit",
    "readonly": false,
    "description": "Edit an existing API key Body fields (* required): id*, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, endpoints, subaccount_id."
  },
  {
    "group": "domain",
    "name": "editReturnPath",
    "method": "POST",
    "path": "/domain/returnpath",
    "readonly": false,
    "description": "A Return Path Subdomain is used to instruct the server where to return emails that are not deliverable (ie. Bounces). This endpoint allows you to edit a Return Path Subdomain for a particular sender domain. Full details can be found in the Sender Domain Guide. Body fields (* required): domain*, old_subdomain*, new_subdomain*, subaccount_id."
  },
  {
    "group": "domain",
    "name": "editSubaccountAccess",
    "method": "POST",
    "path": "/domain/subaccount_access",
    "readonly": false,
    "description": "Allow subaccounts to send from verified sender domains on the master account. Body fields (* required): domain*, subaccounts*, future_subaccounts."
  },
  {
    "group": "domain",
    "name": "editTrackingDomain",
    "method": "POST",
    "path": "/domain/tracking",
    "readonly": false,
    "description": "A Tracking Subdomain is used to monitor your email opens and clicks. This endpoint allows you to edit a tracking subdomain for a particular sender domain. Full details can be found in the Sender Domain Guide. Body fields (* required): domain*, old_subdomain*, new_subdomain*, subaccount_id."
  },
  {
    "group": "webhook",
    "name": "edit",
    "method": "POST",
    "path": "/webhook/edit",
    "readonly": false,
    "description": "Make changes to a specific webhook using its unique ID. Body fields (* required): id*, url, events, sms_events, headers, usernames, output_format, subaccount_id, auth_header_type, auth_header_value, disabled."
  },
  {
    "group": "stats",
    "name": "emailBounces",
    "method": "POST",
    "path": "/stats/email_bounces",
    "readonly": true,
    "description": "Retrieve a summary of bounces and rejects, for the last 30 days. Body fields (* required): username."
  },
  {
    "group": "stats",
    "name": "emailCycle",
    "method": "POST",
    "path": "/stats/email_cycle",
    "readonly": true,
    "description": "Retrieve a summary of your Account activity, including the start and end date of your monthly plan, the number of emails sent this cycle, the number of emails remaining and the number of emails in your monthly allowance."
  },
  {
    "group": "stats",
    "name": "emailHistory",
    "method": "POST",
    "path": "/stats/email_history",
    "readonly": true,
    "description": "Retrieve a summary of activity from a specified date range (defaults to last 30 days), per sender email address, SMTP username, domain or subaccount. Body fields (* required): group_by, start_date, end_date, subaccounts."
  },
  {
    "group": "stats",
    "name": "emailSpam",
    "method": "POST",
    "path": "/stats/email_spam",
    "readonly": true,
    "description": "Retrieve a summary of spam complaints and rejects, for the last 30 days. Body fields (* required): username."
  },
  {
    "group": "stats",
    "name": "emailSummary",
    "method": "POST",
    "path": "/stats/email_summary",
    "readonly": true,
    "description": "Retrieve a combination of the email_bounces, email_cycle, email_spam, and email_unsubs calls in one report. Note this call may take longer to complete. Body fields (* required): username."
  },
  {
    "group": "stats",
    "name": "emailUnsubs",
    "method": "POST",
    "path": "/stats/email_unsubs",
    "readonly": true,
    "description": "Retrieve a summary of unsubscribes and rejects, for the last 30 days. Body fields (* required): username."
  },
  {
    "group": "smtpUsers",
    "name": "patch",
    "method": "PATCH",
    "path": "/users/smtp/edit",
    "readonly": false,
    "description": "Patch an existing SMTP user ignoring missing properties Body fields (* required): username*, email_password, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, subaccount_id."
  },
  {
    "group": "apiKeys",
    "name": "patch",
    "method": "PATCH",
    "path": "/api_keys/edit",
    "readonly": false,
    "description": "Patch an existing API key ignoring missing properties Body fields (* required): id*, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, endpoints, subaccount_id."
  },
  {
    "group": "ipAuth",
    "name": "patch",
    "method": "PATCH",
    "path": "/ip_auth/edit",
    "readonly": false,
    "description": "Patch an existing IP Auth ignoring missing properties Body fields (* required): ip_address*, description, custom_ratelimit, custom_ratelimit_value, custom_ratelimit_period, ip_pool, feedback_enabled, feedback_html, feedback_text, open_tracking_enabled, click_tracking_enabled, archive_enabled, audit_email, bounce_notifications, status, subaccount_id."
  },
  {
    "group": "singleSenderEmails",
    "name": "remove",
    "method": "POST",
    "path": "/single_sender_emails/remove",
    "readonly": false,
    "description": "Remove a single sender email address from your account. Include the address to remove as the email_address parameter. Body fields (* required): email_address*, subaccount_id."
  },
  {
    "group": "suppression",
    "name": "remove",
    "method": "POST",
    "path": "/suppression/remove",
    "readonly": false,
    "description": "Removes the suppression on the specified email address or domain Body fields (* required): email_address*, reasons*, subaccount_id."
  },
  {
    "group": "allowedRecipients",
    "name": "remove",
    "method": "POST",
    "path": "/allowed_recipients/remove",
    "readonly": false,
    "description": "Remove one or more emails addresses or domain names stored in your Allowed Recipients List. Note: In the event that any of the email addresses or domains do not feature in the list, no error will be raised. Body fields (* required): allowed_recipients*, enabled, subaccount_id."
  },
  {
    "group": "allowedSenders",
    "name": "remove",
    "method": "POST",
    "path": "/allowed_senders/remove",
    "readonly": false,
    "description": "Remove one or more emails addresses or domain names stored in your Allowed or Restricted Senders List. Note: In the event that any of the email addresses or domains do not feature in the list, no error will be raised. Body fields (* required): allowed_senders*, subaccount_id."
  },
  {
    "group": "template",
    "name": "remove",
    "method": "POST",
    "path": "/template/delete",
    "readonly": false,
    "description": "Deletes the specified email template. Body fields (* required): id*."
  },
  {
    "group": "smtpUsers",
    "name": "remove",
    "method": "POST",
    "path": "/users/smtp/remove",
    "readonly": false,
    "description": "Remove an SMTP user from your account Body fields (* required): username*, subaccount_id."
  },
  {
    "group": "apiKeys",
    "name": "remove",
    "method": "POST",
    "path": "/api_keys/remove",
    "readonly": false,
    "description": "Remove an existing API key Body fields (* required): id*, subaccount_id."
  },
  {
    "group": "ipAuth",
    "name": "remove",
    "method": "POST",
    "path": "/ip_auth/remove",
    "readonly": false,
    "description": "Remove an IP Auth entry from your account Body fields (* required): ip_address*, subaccount_id."
  },
  {
    "group": "scheduledEmails",
    "name": "remove",
    "method": "POST",
    "path": "/email/scheduled/remove",
    "readonly": false,
    "description": "Removes a scheduled email by ID Body fields (* required): schedule_id*."
  },
  {
    "group": "domain",
    "name": "remove",
    "method": "POST",
    "path": "/domain/remove",
    "readonly": false,
    "description": "Remove a sender domain from your account Body fields (* required): domain*, subaccount_id."
  },
  {
    "group": "webhook",
    "name": "remove",
    "method": "POST",
    "path": "/webhook/remove",
    "readonly": false,
    "description": "Remove a specific webhook using its unique ID. Body fields (* required): id*, subaccount_id."
  },
  {
    "group": "subaccount",
    "name": "reopen",
    "method": "POST",
    "path": "/subaccount/reopen",
    "readonly": false,
    "description": "Changes the status of a Closed subaccount back to Active Body fields (* required): email, id*."
  },
  {
    "group": "activity",
    "name": "search",
    "method": "POST",
    "path": "/activity/search",
    "readonly": true,
    "description": "Returns events (such as opens, unsubscribes) which match the filters passed. A count of events matching the filter is also included, as this may surpass the maximum of 1,000 items included within the response. This endpoint is rate-limited to 60 requests per minute. Body fields (* required): start_date, end_date, search, search_email_id, search_subject, search_sender, search_recipient, search_usernames, subaccounts, limit, continue_token, only_latest, only_latest_by_sent, event_types, include_headers, custom_headers, region."
  },
  {
    "group": "archive",
    "name": "search",
    "method": "POST",
    "path": "/archive/search",
    "readonly": true,
    "description": "Retrieve a list of up to 5,000 archived emails matching the supplied parameters. Body fields (* required): start_date, end_date, limit, username, recipient, sender, envelope_from, subject, headers, continue_token, subaccount_id."
  },
  {
    "group": "template",
    "name": "search",
    "method": "POST",
    "path": "/template/search",
    "readonly": true,
    "description": "Search your collection of email templates. Returns any templates that match your search criteria. Body fields (* required): fuzzy_search, search_terms, tags, sort_direction, page_size, continue_token."
  },
  {
    "group": "scheduledEmails",
    "name": "search",
    "method": "POST",
    "path": "/email/scheduled/search",
    "readonly": true,
    "description": "Allows searching of scheduled emails Body fields (* required): schedule_id, search_subject, search_recipient, search_sender, limit, page."
  },
  {
    "group": "subaccount",
    "name": "search",
    "method": "POST",
    "path": "/subaccounts/search",
    "readonly": true,
    "description": "Returns any subaccounts that match search criteria Body fields (* required): fuzzy_search, search_terms, states, sort_direction, page_size, continue_token."
  },
  {
    "group": "email",
    "name": "batch",
    "method": "POST",
    "path": "/email/batch",
    "readonly": false,
    "description": "Send a batch of emails Body fields (* required): emails*."
  },
  {
    "group": "email",
    "name": "mime",
    "method": "POST",
    "path": "/email/mime",
    "readonly": false,
    "description": "Send an email by supplying a pre-encoded MIME string Body fields (* required): mime_email*, schedule, fastaccept."
  },
  {
    "group": "sms",
    "name": "send",
    "method": "POST",
    "path": "/sms/send",
    "readonly": false,
    "description": "Send an SMS message to one or more numbers, up to a maximum of 100 numbers. Body fields (* required): destination*, sender, content*."
  },
  {
    "group": "email",
    "name": "send",
    "method": "POST",
    "path": "/email/send",
    "readonly": false,
    "description": "Send an email by passing a JSON email object Body fields (* required): sender*, to*, cc, bcc, subject, html_body, text_body, custom_headers, attachments, inlines, template_id, template_data, schedule, fastaccept."
  },
  {
    "group": "sms",
    "name": "summary",
    "method": "POST",
    "path": "/sms/summary",
    "readonly": true,
    "description": "Retrieve a summary of SMS messages within a certain time range. Body fields (* required): start_date, end_date, subaccount_id."
  },
  {
    "group": "subaccount",
    "name": "edit",
    "method": "POST",
    "path": "/subaccount/edit",
    "readonly": false,
    "description": "Changes the details on an existing subaccount Body fields (* required): id*, fullname, limit, dedicated_ip, archiving, enforce_2fa, enable_sms, sms_limit."
  },
  {
    "group": "allowedRecipients",
    "name": "update",
    "method": "POST",
    "path": "/allowed_recipients/update",
    "readonly": false,
    "description": "Replace the email addresses and domain names on your Allowed Recipients List using this endpoint. Further details of these modes are found in the SMPT2GO Guides. Note that a post to this endpoint will return a success, even if the setting is not in use. Body fields (* required): allowed_recipients*, enabled*, subaccount_id."
  },
  {
    "group": "allowedSenders",
    "name": "update",
    "method": "POST",
    "path": "/allowed_senders/update",
    "readonly": false,
    "description": "Replace the email addresses and domain names on your Allowed or Restricted Senders List using this endpoint. How the email addresses and domain names are used is defined in the current 'mode' value - further details of these modes are found in the SMPT2GO Guides. Note that a post to this endpoint will return a success, even if the setting is not in use. Body fields (* required): allowed_senders*, mode*, subaccount_id."
  },
  {
    "group": "template",
    "name": "edit",
    "method": "POST",
    "path": "/template/edit",
    "readonly": false,
    "description": "Changes details of an existing email template. Body fields (* required): id*, new_id, template_name, subject, html_body, text_body, template_variables, tags."
  },
  {
    "group": "domain",
    "name": "verify",
    "method": "POST",
    "path": "/domain/verify",
    "readonly": false,
    "description": "Verify a sender domain on your account removing the need to wait for the periodic verification every 7 minutes. Body fields (* required): domain*, requisition_ssl, subaccount_id."
  },
  {
    "group": "singleSenderEmails",
    "name": "view",
    "method": "POST",
    "path": "/single_sender_emails/view",
    "readonly": true,
    "description": "Returns a list of single sender email addresses on your account, along with their verification status. If you include a email_address, the response will only include items matching this search. Body fields (* required): email_address, subaccount_id."
  },
  {
    "group": "allowedRecipients",
    "name": "view",
    "method": "POST",
    "path": "/allowed_recipients/view",
    "readonly": true,
    "description": "Returns the email addresses and domain names on your Allowed Recipients list. Body fields (* required): subaccount_id."
  },
  {
    "group": "allowedSenders",
    "name": "view",
    "method": "POST",
    "path": "/allowed_senders/view",
    "readonly": true,
    "description": "Returns the email addresses and domain names on your Allowed or Restricted Senders list, as well as the Restrict Senders setting, which dictates how they are interpreted. Body fields (* required): subaccount_id."
  },
  {
    "group": "archive",
    "name": "get",
    "method": "POST",
    "path": "/archive/email",
    "readonly": true,
    "description": "Fetch an archived email using the email_id Body fields (* required): email_id*, subaccount_id."
  },
  {
    "group": "apiKeys",
    "name": "permissions",
    "method": "POST",
    "path": "/api_keys/permissions",
    "readonly": true,
    "description": "Retrieve a list of endpoints this API Key can use. This endpoint is available to all API Keys."
  },
  {
    "group": "apiKeys",
    "name": "view",
    "method": "POST",
    "path": "/api_keys/view",
    "readonly": true,
    "description": "Retrieve a list of API keys on this account Body fields (* required): id, search, subaccount_id."
  },
  {
    "group": "dedicatedIps",
    "name": "view",
    "method": "POST",
    "path": "/dedicated_ips/view",
    "readonly": true,
    "description": "Retrieve a list of Dedicated IP addresses on this account"
  },
  {
    "group": "ipAuth",
    "name": "view",
    "method": "POST",
    "path": "/ip_auth/view",
    "readonly": true,
    "description": "Returns a list of all IP Auth entries that are managed by this account, or details of a specific IP Auth, when you include the [ip_address] in your request. If no entries are available, this will return an empty list. Body fields (* required): ip_address, subaccount_id."
  },
  {
    "group": "sms",
    "name": "viewReceived",
    "method": "POST",
    "path": "/sms/view-received",
    "readonly": true,
    "description": "View received SMS messages. Body fields (* required): start_date, end_date, unix_start, unix_end, username, subaccount_id."
  },
  {
    "group": "domain",
    "name": "view",
    "method": "POST",
    "path": "/domain/view",
    "readonly": true,
    "description": "Returns a list of sender domains on your account Body fields (* required): domain, subaccount_id."
  },
  {
    "group": "email",
    "name": "search",
    "method": "POST",
    "path": "/email/search",
    "readonly": true,
    "description": "Retrieve a list of up to 5,000 sent emails matching the supplied parameters. The filter_query field can be used to create complex filters to make your searching more efficient. Find full details in the Email and Email Archive Guide. Note: Allow around two minutes after delivery for recently sent emails to be included in a search result. This endpoint is deprecated and will not be accessible in future API... Body fields (* required): start_date, end_date, limit, status_counts, opened_only, clicked_only, ignore_case, filter_query, email_id, username, headers, continue_token."
  },
  {
    "group": "sms",
    "name": "viewSent",
    "method": "POST",
    "path": "/sms/view-sent",
    "readonly": true,
    "description": "View sent SMS messages. Body fields (* required): start_date, end_date, username, subaccount_id."
  },
  {
    "group": "smtpUsers",
    "name": "view",
    "method": "POST",
    "path": "/users/smtp/view",
    "readonly": true,
    "description": "Returns a list of all SMTP users that are managed by this account, or details of a specific user, when you include the [username] in your request. If no users are available, this will return an empty list. Body fields (* required): username, subaccount_id."
  },
  {
    "group": "suppression",
    "name": "view",
    "method": "POST",
    "path": "/suppression/view",
    "readonly": true,
    "description": "Returns your suppressed email addresses and domains Body fields (* required): continue_token, email_address, end_date, fuzzy, reason, reasons, recipient, recipients, sort, start_date, suppression_type, suppression_types, wildcard, subaccount_id."
  },
  {
    "group": "template",
    "name": "view",
    "method": "POST",
    "path": "/template/view",
    "readonly": true,
    "description": "Returns details of the email template with the specified ID. Body fields (* required): id*."
  },
  {
    "group": "webhook",
    "name": "view",
    "method": "POST",
    "path": "/webhook/view",
    "readonly": true,
    "description": "Returns information for configured webhooks. Body fields (* required): subaccount_id."
  }
];
