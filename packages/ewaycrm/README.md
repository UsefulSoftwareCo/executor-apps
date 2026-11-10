# eWay-CRM

Contacts, companies, leads, projects, journals, tasks, documents, emails, relations, users, permissions and the rest of the eWay-CRM Web Service API (412 tools; the 159 that change data require approval).

**Interface:** OpenAPI. The app reads eWay-CRM's own Swagger 2.0 document from the connected instance at `<Web Service address>/API/swagger.json` (the same document backs https://swagger.eway-crm.io, and the package compiles against the public demo instance, https://free.eway-crm.com/31994/API/swagger.json). Nearly every method is a POST, so reads are marked by name (`Get*`, `Search*`, `Check*`, `Is*`, `Have*`, `Can*`) and everything else needs approval.

**Auth:** username and password only. Enter the instance's Web Service address (for example `free.eway-crm.com/31994`; see "How to find Web Service URL" in eWay-CRM's knowledge base), the user name and the password. Use a dedicated API user with enough permissions, and note the API needs a Contacts & Companies (Standard) licence. The app logs in with `LogIn` (MD5 password hash, as eWay-CRM's own libraries do), keeps the session, and adds `sessionId` to every call; it logs in again when the session expires. The `LogIn` operation itself is not exposed as a tool.

**Known gaps:**
- OAuth is not offered. eWay-CRM's OAuth (authorization code, client id and secret issued by eWay-CRM support, required when an instance uses Azure sign-in) has per-instance endpoints (`<service>/auth/connect/authorize` and `/token`), and the `apps` framework (0.0.1-beta.83) only accepts static endpoint strings. Instances that require Azure sign-in therefore cannot be connected.
- Only cloud instances on `*.eway-crm.com` are accepted; self-hosted Web Services on other domains are not.
- The few GET methods that expect a session in the query string (attachment downloads, XSLT) do not get one added.
