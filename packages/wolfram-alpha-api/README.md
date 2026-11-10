# Wolfram|Alpha API

Computational knowledge from Wolfram|Alpha: the Full Results API (structured pods as JSON), the LLM API (text formatted for language models), Short Answers, Spoken Results, the Simple API (result image as base64), the Fast Query Recognizer and the Summary Box API.

**Interface:** hand-written tools over Wolfram|Alpha's official HTTP APIs (docs: https://products.wolframalpha.com/api/documentation). Wolfram publishes no official OpenAPI document, GraphQL API or MCP server for these APIs (the docs index mentions none). An APIs.guru "Wolfram" OpenAPI conversion exists (listed by integrations.sh) but it is a third-party spec and was deliberately not used. Each endpoint is a `fetch` tool against `https://api.wolframalpha.com` (`/v2/query`, `/v1/result`, `/v1/spoken`, `/v1/simple`) and `https://www.wolframalpha.com` (`/api/v1/llm-api`, `/queryrecognizer/query.jsp`, `/summaryboxes/v1/query`). The vendor examples use `http://`; this package uses `https://`, which answers on every one of these hosts. The Summary Box API returns an XHTML document, which the tool returns as a string.

**Instant Calculators:** the Instant Calculators API has no endpoints of its own. It is the Fast Query Recognizer (`recognizeQuery`, which lists the formula and variables) followed by Full Results (`fullResults`) driven by `assumption` strings, so it works through those two tools. Pass several assumptions to `fullResults.assumption` separated by newlines; they are sent as repeated `assumption` parameters. There is no dedicated tool that builds the assumption strings.

**Auth:** AppID (API key). Register a Wolfram ID and create an app in the Developer Portal at https://developer.wolframalpha.com to get one. It is sent as the `appid` query parameter, as the docs require. There is no OAuth.

**Notes:** every tool is read-only, so none require approval. Calls count against the AppID's monthly quota. A 501 response means the input could not be interpreted. Endpoint behavior was written from the official docs and not exercised against the live API (no real credentials were used). The icon is the Wolfram|Alpha star mark, taken from the SVG served by wolframalpha.com (`/_next/static/images/spikey_*.svg`). `includepodid` and `excludepodid` cannot be combined (as documented), and the Full Results tool rejects both together.

**Gaps:** the optional `sig` request signature parameter is not supported; Full Results always requests JSON output.
