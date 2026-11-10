# BrowserAct

Run BrowserAct hosted browser-automation bots and official bot templates, poll, inspect, resume and cancel tasks, list your published bots and templates, and list the supported proxy regions.

## Interface

OpenAPI, from BrowserAct's own v3 document at https://docs.browseract.com/openapi_3.json (12 operations under `https://api.browseract.com/v3/bots`). The older v2 documents (`openapi.json`, `openapi_2.json`) describe the legacy workflow API and are not used. Every POST (run, resume, cancel) requires approval.

## Auth

API key. In the BrowserAct dashboard go to Integrations, then Manage API Keys, then Create New API Key. The key is sent as `Authorization: Bearer <key>` to `api.browseract.com`. BrowserAct offers no OAuth for third-party apps.

## Known gaps

- Only bots with a published, runnable version are listed or runnable.
- The Agent CLI and the "bots as MCP tools" integration are separate products and are not covered.
- The icon is the vendor's 192px PNG "B" mark (the favicon-set `android-chrome-192x192.png`), which matches the logo at docs.browseract.com `logo/light.png` and `logo/dark.png`. The vendor also serves `favicon.svg`, but that is a different green leaf glyph, not the product mark, so it is not used. The PNG's dark outline blends into dark tiles but the green mark stays clear.
