# ServerAvatar

Manage ServerAvatar (server management for PHP, WordPress and Node.js hosting): organizations, servers, applications, application domains, SSL, databases, cron jobs, firewall rules, supervisor processes and backups.

**Interface:** hand-written tools over ServerAvatar's REST API at `https://api.serveravatar.com`, documented at https://serveravatar.com/api-docs/. ServerAvatar publishes no OpenAPI document, so the tools cover the 45 most useful of the documented endpoints. Queries run freely; every tool that changes state asks for approval (including the few documented as `GET`, such as server restart).

**Auth:** API key. Create it in your ServerAvatar account (Account, API). Only one key is active at a time. The package sends `Authorization: Bearer <key>`. The vendor docs are inconsistent: the basic-authentication page (https://serveravatar.com/api-docs/endpoint/application/basic-authentication.html) and the API Console use `Bearer`, while the organization page (https://serveravatar.com/api-docs/endpoint/organization/) shows the raw token. Bearer follows the majority of examples; it has not been verified against a live account. The key goes only to `api.serveravatar.com`. ServerAvatar has no OAuth.

**Known gaps:** file manager, Git deployment, Cloudflare integration, Fail2ban, WordPress toolkit and blueprints, staging, site clone and migration, whitelabel, server and application creation, application users and backup creation are not exposed yet. Request bodies are passed through as documented, so refer to the API docs for each field's allowed values.
