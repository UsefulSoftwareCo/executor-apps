# Outlook

Outlook mail, mail folders, messages, attachments, calendars, calendar groups, events, meeting-time
suggestions, contacts, contact folders, categories and focused-inbox overrides of the signed-in
user, through Microsoft Graph. 331 tools; every mutation requires approval.

## Interface

OpenAPI. `graph-outlook.json` is Microsoft's official Microsoft Graph v1.0 document
(https://github.com/microsoftgraph/msgraph-metadata/blob/master/openapi/v1.0/openapi.yaml,
about 44 MB for all of Graph) reduced to the `/me/messages`, `/me/mailFolders`, `/me/events`,
`/me/calendar*`, `/me/calendarView`, `/me/contacts`, `/me/contactFolders`, `/me/outlook`,
`/me/sendMail`, `/me/findMeetingTimes` and `/me/inferenceClassification` paths, with only the
component schemas those paths reference. Paths nested more than three levels, `$ref` links and
open extensions are dropped, and `discriminator` blocks are removed (their mappings pointed at schemas the
reduction dropped). Nothing else was edited. Calls go to `https://graph.microsoft.com/v1.0`.
Graph's own conventions apply: OData query options (`$select`, `$filter`, `$top`, `$orderby`) are
available as tool inputs.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint, discovered from
`https://login.microsoftonline.com/common/v2.0`). Register an app in the Entra admin center
(App registrations), add a Web redirect URI matching the one Executor shows on the connect page,
create a client secret, and enter the client ID and secret in Executor. Scopes: `offline_access`,
`User.Read`, `Mail.ReadWrite`, `Mail.Send`, `MailboxSettings.ReadWrite`, `Calendars.ReadWrite`,
`Contacts.ReadWrite`. No admin consent is required for personal or work accounts; a tenant may
still restrict user consent. Register the app with supported account types "Accounts in any organizational directory and
personal Microsoft accounts" (`signInAudience` `AzureADandPersonalMicrosoftAccount`); the `common`
authority rejects single-tenant registrations.

## Gaps

- Acts only on the signed-in user (`/me`); shared and delegated mailboxes (`/users/{id}`) are not
  included.
- The service-to-service (client-credentials) method is not offered, since it needs tenant
  admin consent and a per-user path.
- Message attachments upload sessions, batch requests and change-notification subscriptions are
  not included.
- The bundled document is a snapshot; refresh it from msgraph-metadata to pick up new operations.
