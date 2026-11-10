# LastPass

Administers a LastPass Business or Enterprise account through the Enterprise (provisioning) API: list users, provision, disable and delete users, reset passwords, disable multifactor, change group membership, list shared folders and pull the activity report. 9 hand-written tools; every mutation requires approval.

**Interface:** custom (`fetch`). LastPass publishes no OpenAPI document; the API is a single endpoint, `POST https://lastpass.com/enterpriseapi.php` (EU-region accounts: `https://lastpass.eu/enterpriseapi.php`), with a JSON body `{ cid, provhash, cmd, data }`. Commands come from LastPass's provisioning API documentation (https://support.lastpass.com/help/use-the-lastpass-provisioning-api-lp010068).

**Auth:** one method, `provisioningHash` (secrets): the account number (CID) and a provisioning hash, plus an optional `region` (`us` default, or `eu` for accounts on lastpass.eu; both hosts are declared). An admin finds the CID and generates the hash in the Admin Console under Advanced > Enterprise API. There is no OAuth.

**Known gaps:** the Enterprise API cannot read vault items, and it has no current-user endpoint, so the health check lists one user. The separate early-access LastPass REST API (`Api-Key` auth) is not covered. Shared-folder creation and update commands are not exposed.
