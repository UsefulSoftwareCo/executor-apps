# Fiber AI

Fiber AI is a B2B data platform: search companies and people, enrich profiles (including live LinkedIn data), reveal work emails and phone numbers, build audiences, manage trackers and check credits.

**Interface:** OpenAPI, from Fiber AI's official document at <https://api.fiber.ai/openapi.json> (about 250 operations, all on `https://api.fiber.ai`). The document declares no security scheme and asks for `apiKey` as a query parameter or body property, so `openapi.ts` carries generated patches that bind every operation to the `x-api-key` header (which the API accepts) and remove `apiKey` from tool inputs. If Fiber AI adds operations that take `apiKey` in a new place, regenerate the patches.

**Auth:** API key. Create one at <https://fiber.ai/app/api> and paste it when connecting. The key is sent only to `api.fiber.ai`. Fiber AI offers no OAuth.

**Approvals:** every mutation asks for approval. Many Fiber AI operations spend credits; each operation's description states its cost.

**Known gaps:** the account sign-in operations (`send-otp`, `verify-otp`) are included but are not useful with an existing key. Mutation classification follows HTTP method, so some POST search operations also require approval.
