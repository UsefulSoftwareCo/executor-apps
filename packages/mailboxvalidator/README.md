# MailboxValidator

Email address verification through MailboxValidator: single-address validation (syntax, MX record, SMTP and mailbox checks, disposable, free, role, high-risk, catch-all and suppression flags, greylisting, DMARC/SPF strictness and a reputation score), a disposable-email check and a free-email check. Exposed as `validateEmail`, `checkDisposable` and `checkFree`.

**Interface:** custom tools written with `fetch` against the vendor's REST API at `https://api.mailboxvalidator.com/v2` (`/validation/single`, `/email/disposable`, `/email/free`), per https://www.mailboxvalidator.com/api-single-validation, https://www.mailboxvalidator.com/api-email-disposable and https://www.mailboxvalidator.com/api-email-free. MailboxValidator publishes no OpenAPI document of its own (the only specs are APIs.guru conversions, which are not used), and its npm MCP server is a local stdio process, not a remote one.

**Auth:** API key only (no OAuth). Create or copy the key from your MailboxValidator dashboard (https://www.mailboxvalidator.com/). It is sent as the `key` query parameter.

**Health check:** there is no account endpoint, so the check calls `/email/free` with no email. A valid key is expected to get error 10000 (missing parameter) without spending a credit; errors 10001, 10002 and 10003 reject the key. This is inferred from the documented error table and has not been run against a live key.

**Known gaps:** Yahoo addresses are unsupported by the validation API. The documented plan/credits lookup does not exist publicly, so remaining credits are only visible in each result's `credits_available`. The domain and role-email demos on the site have no documented API and are not exposed. Bulk list validation is a separate web product and not covered.
