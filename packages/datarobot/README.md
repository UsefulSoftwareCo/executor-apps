# DataRobot

DataRobot's public API: projects, models, datasets, deployments, predictions, monitoring, model registry, custom models, use cases, notebooks and governance. 1312 tools (599 mutations, all requiring approval), 0 skipped.

## Interface

OpenAPI 3.1, DataRobot's own document, served live at https://app.datarobot.com/api/v2/openapi.yaml (the same API reference as https://docs.datarobot.com/en/docs/api/reference/public-api/index.html). Its server is the relative `/`, so the tools are pointed at the account's host.

## Auth

- API key (bearer token). Create it in DataRobot via the user icon > API keys and tools > Personal API keys > Create new key (US direct link: https://app.datarobot.com/account/developer-tools). Enter it with the host of your DataRobot region: `app.datarobot.com` (US), `app.eu.datarobot.com` (EU) or `app.jp.datarobot.com` (Japan).
- OAuth is not offered: no user-registered OAuth app flow is documented for the public API (the docs only describe Inbound OAuth, where a customer identity provider's tokens are used as bearer tokens).

## Gaps

- Self-managed and single-tenant installations on other hosts are not supported; credentials are restricted to the three managed-cloud hosts.
- The spec is large (about 4.6 MB), so the first tool listing is slow.
