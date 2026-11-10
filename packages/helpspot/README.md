# HelpSpot

Help desk requests, notes, time tracking, filters, canned responses, staff, address book, audit log and saved reports in HelpSpot (self-hosted or HelpSpot-hosted).

**Interface:** custom tools over HelpSpot's private web service API, `<your HelpSpot URL>/api/index.php?method=private.*&output=json`. HelpSpot publishes no OpenAPI document or MCP server, so the 35 operations come from the official manual: https://support.helpspot.com/index.php?pg=kb.page&id=164. Each tool takes a `params` object using HelpSpot's own parameter names. Reads are queries; every POST is a mutation and requires approval. The public API (`request.create`, `request.get`) is not included; `private.request.create` covers it.

**Auth** (the account also stores your HelpSpot URL, for example `https://help.example.com`, with any sub-path install kept):

- **API token** (recommended): a staff member creates it in HelpSpot in the staff preferences area of their HelpSpot profile. Sent as `Authorization: Bearer`. It carries that user's rights and is the only option with SAML2 or two-factor authentication.
- **Staff email and password**: HTTP Basic. Not available under SAML2 or with two-factor authentication.

There is no OAuth. The private API must be enabled in Admin > Settings > Web Services API.

**Known gaps:** file attachments on `request.create` and `request.update` (`File#_bFileBody`) are passed as plain form fields, and `document.get` returns JSON bodies parsed and any other content as `{ contentType, encoding: "base64", data }` (unverified without a live instance). `customer.setPasswordByEmail` is omitted because it is a GET that puts a password in the query string. Responses are requested as JSON; HelpSpot returns errors with HTTP 400. Because install domains are arbitrary the provider declares no `hosts`; tool calls only go to the account's own URL. The icon is the mark from the vendor's logo at https://www.helpspot.com/helpspot-logo.svg (wordmark removed).

**Unverified against the vendor:** the manual is inconsistent on a few operations, and they could not be checked without credentials: `response.usersMostCommon` (private.request.* in one place, private.response.* in the example), `report.getSaved` (private.report.* vs private.filter.*) and `addressBook.getContacts` (GET vs POST in the example). The package uses private.response.usersMostCommon, private.report.getSaved and GET.
