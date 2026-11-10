# DeployHQ

Projects, servers, deployments, repositories, build commands, config files, environment variables, agents, invoices and account settings in DeployHQ.

**Interface:** OpenAPI 3.1, the official document published by DeployHQ at https://api.deployhq.com/docs.json (interactive docs at https://api.deployhq.com/docs). 214 tools; every mutation requires approval. Two operations are skipped because the document marks them invalid.

**Auth:** API key only. DeployHQ uses HTTP Basic with your login email and a 40-character API key, and has no OAuth for third-party apps. Find the key under Settings > Security in your DeployHQ account. Connect with your account name (the `<account>` in `<account>.deployhq.com`), your email and the API key. The API is only available on plans that include API access.

**Gaps:** requests go to the account's own host, so the spec's placeholder servers are replaced at runtime. Unauthenticated endpoints (signup) are exposed but unused.
