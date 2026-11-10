# DNSFilter

Manage DNSFilter cloud DNS security and content filtering: organizations, networks, policies, roaming clients, block and allow lists, users, agents and traffic reports.

**Interface:** OpenAPI 3.0 document published by DNSFilter at https://api.dnsfilter.com/docs/api.json (the Export source of https://api.dnsfilter.com/docs), about 227 paths. Mutations require approval.

**Auth:** API key. In DNSFilter go to Account Settings, Security tab, API Keys, Create Key (https://help.dnsfilter.com/hc/en-us/articles/21169189058323-API-Keys). The key is a JWT sent as the raw `Authorization` header value, with no `Bearer` prefix. It carries the permissions of the user who created it. DNSFilter has no user-created OAuth apps.

**Known gaps:** rate limit is 2,000 requests per 300 seconds per organization. Keys are limited to five per user.
