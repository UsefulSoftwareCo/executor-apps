# CrewAI

Run deployed CrewAI AMP crews: discover a crew's required inputs, start executions, check status and results, and resume human-in-the-loop runs. 4 tools (2 mutations, approval-gated).

**Interface:** OpenAPI, CrewAI's official AMP document at https://docs.crewai.com/enterprise-api.en.yaml, fetched live. The document lists placeholder servers; the package substitutes the account's own crew URL.

**Auth:** crew bearer token only. Each account is one deployed crew: enter its URL (https://<crew>.crewai.com) and its Bearer Token or User Bearer Token, both shown in the Status tab of the crew's page in the CrewAI AMP dashboard. CrewAI offers no user-created OAuth apps, so OAuth is not offered.

**Icon:** the CrewAI mark from Simple Icons.

**Gaps:** the public API covers running crews only; the AMP control plane (deployments, organizations) has no public spec. Crews on custom domains outside crewai.com are not supported.
