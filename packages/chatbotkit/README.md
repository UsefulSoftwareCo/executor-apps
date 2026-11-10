# ChatBotKit

Build and manage ChatBotKit conversational AI from Executor: bots, datasets, skillsets, conversations, files, secrets, blueprints, integrations, usage and more (330 tools).

**Interface:** OpenAPI. ChatBotKit's own document at https://api.chatbotkit.com/v1/spec.json. Every operation is under `https://api.chatbotkit.com/v1`. Mutations require approval.

**Auth:** API key only (ChatBotKit has no user-created OAuth apps). Create a secret key (`sk-...`) on the Tokens page of the ChatBotKit dashboard (https://chatbotkit.com/tokens, Developer section; click Create Token), and paste it as the API key. It is sent as a bearer token to `api.chatbotkit.com`.

**Known gaps:** 5 operations are skipped by the compiler (2 with an unsupported auth method, 1 schema reference, 2 external references). Streaming endpoints return their final payload rather than a live stream.
