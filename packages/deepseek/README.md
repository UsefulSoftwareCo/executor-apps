# DeepSeek

Call DeepSeek models from Executor: chat completions (models `deepseek-flash` and `deepseek-v4-pro`, thinking and reasoning_effort controls, tool-call round trips), fill-in-the-middle completions, the model list and the account balance (4 tools).

## Interface

Custom, hand-written tools with `fetch`. DeepSeek publishes no OpenAPI document (api-docs.deepseek.com serves only HTML; the community specs on GitHub are unofficial and not used). Tools follow the official API reference at https://api-docs.deepseek.com/ and call `https://api.deepseek.com`: `models`, `balance`, `chat.completion` (`POST /chat/completions`) and `fim.completion` (`POST /beta/completions`).

## Auth

- API key: create one at https://platform.deepseek.com/api_keys. Sent as `Authorization: Bearer <key>`.

DeepSeek offers no OAuth. The two completion tools are POSTs and require approval.

## Known gaps

- Streaming is not supported; requests always send `stream: false`.
- Tool-calling `tools`, `tool_choice` and `tool_calls` entries are passed through unvalidated; message `content` accepts a string or an array of parts.
- The removed `frequency_penalty` and `presence_penalty` parameters (ignored by DeepSeek) are not exposed.
- The Anthropic-compatible endpoint (`https://api.deepseek.com/anthropic`, `POST /v1/messages`) is not exposed.
- Other options not listed on the tools (for example `stream_options`, FIM `logprobs`) are not exposed.
