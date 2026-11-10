# Namely

Namely HR: employee profiles and custom profile fields, groups and teams, job titles and tiers, countries, company resources and folders, home feed announcements, comments, likes, notifications and saved reports. 53 hand-written tools covering the documented operations in Namely's published API reference.

## Interface

Custom tools over the REST API at `https://<company>.namely.com/api/v1`. Namely publishes its reference at https://developers.namely.com/ (hosted on Stoplight) but offers no downloadable OpenAPI document, and the host is per customer, so the tools are written by hand from the reference. Tools take path ids by name, an optional `query` object (paging and filters such as `filter[user_status]`) and, for writes, a JSON `body`. Always page `profiles.list` (`per_page` max 50). Every create, update and delete requires approval.

## Auth

Personal access token. In Namely, open the **API** menu item, choose the **Personal Access Tokens** tab and create a token, then connect with your company name (the part before `.namely.com`, for example `acme` or `acme-sandbox`) and the token. The token carries the permissions of the user who created it, so create it from an administrator or a dedicated integrations user; it expires after two years and stops working if that user is deactivated. If you do not see the API menu, ask your Namely administrator.

## Known gaps

Namely OAuth applications are supported by the API, but their authorize and token endpoints live on each customer's own subdomain, which an Executor provider cannot template, so OAuth is not offered. Namely's SSO, SCIM and file-upload flows are not exposed.
