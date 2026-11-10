# Teamwork

Teamwork.com project management: projects, task lists, tasks, milestones, time entries, people, companies, budgets, comments, files, reports and more (430 tools).

**Interface:** OpenAPI. Teamwork's API v3 reference (Swagger 2.0, titled "Teamwork API V3"), served from the asset bucket that backs https://apidocs.teamwork.com. The docs site does not link the file and no vendor-domain URL is published, so it is not formally documented as official: https://contento-assets.s3.eu-west-1.amazonaws.com/oas/teamwork_docs/projects/reference/projects-api-v3.oas2.yml. Requests go to `https://<site>.teamwork.com/projects/api/v3`.

**Auth:** API key. Enter your site name (the `<site>` of `<site>.teamwork.com`) and your API key, found in Teamwork under your profile icon > Edit My Details > API & Mobile > Show your Token (see https://support.teamwork.com/projects/using-teamwork/locating-your-api-key). It is sent as HTTP Basic auth with the key as username and the constant `x` as password; the vendor docs (https://apidocs.teamwork.com/guides/teamwork/authentication) specify `{API_KEY or username}:password` without stating the password, and this has not been verified against a live site.

**Known gaps:**
- OAuth is not offered. Teamwork OAuth apps (created in the Developer Portal; authorize `https://www.teamwork.com/launchpad/login`, token `https://www.teamwork.com/launchpad/v1/token.json`) return the site host in the token response, which a provider cannot template into the request origin.
- Teamwork Desk and Teamwork Spaces have separate APIs and are not covered; the v3 spec covers Teamwork.com only.
- The spec is hosted on a docs asset bucket rather than a vendor domain, so its URL may change without notice.
