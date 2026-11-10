# Keeper (SCIM)

Provisions Keeper Security (Keeper Enterprise) users and teams over Keeper's SCIM 2.0 API: list, get, invite, lock and unlock users, list, create and delete teams (SCIM groups), add or remove team members, raw PATCH operations, the ServiceProviderConfig and RFC 7644 bulk requests. This covers provisioning only, not vault records or the Commander API.

Interface: hand-written tools over Keeper's documented SCIM endpoint, `https://keepersecurity.com/api/rest/scim/v2/<node id>` ([docs](https://docs.keeper.io/en/enterprise-guide/user-and-team-provisioning/automated-provisioning-with-scim)). Keeper publishes no OpenAPI document for it.

Auth: a SCIM bearer token plus the node ID.
- In the Keeper Admin Console open Provisioning for the node, add a SCIM method, and copy the token before saving (a token that was not saved will fail). The node ID (15 digits) is shown in the same place and in the endpoint URL. Each node has its own token; sub-nodes are not covered by a parent node's token.
- Region: leave the default `keepersecurity.com`, or set `keepersecurity.eu`, `keepersecurity.com.au`, `keepersecurity.ca`, `keepersecurity.jp` or `govcloud.keepersecurity.us` to match your tenant.

Known gaps: the email domain must be reserved by the tenant; new users start invited; new teams and team assignments need approval from an admin, Commander `team-approve` or Keeper Automator; DELETE on a user locks it rather than deleting it. Region hosts other than keepersecurity.com come from Keeper's regional documentation and are unverified here.
