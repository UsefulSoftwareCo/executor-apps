# Chatforma

Manage Chatforma chatbots: list bots, forms, users, dialogs and messages, read and manage segments, send dialog messages, predefined messages and text dispatches to a user or a segment, read and write user variables, and manage form-notification subscriptions. 24 hand-written tools.

**Interface:** custom (`fetch`) against the REST API at `https://api.pro.chatforma.com/public/v1/`, written from Chatforma's own Swagger document at https://docs.chatforma.com/docs/chatforma.json. That document declares openapi 3.0.0 but is not valid OAS3 (`in: body` and `in: get` parameter locations, no operation ids, no security scheme), so it is not mounted directly.

**Auth:** API token. Use the API key from your Chatforma profile (the exact menu path is unconfirmed; the vendor Swagger only says "Api key from profile"). It is sent in the `api_key` request header. The account health check calls `GET /auth-test`. The public spec defines no security scheme and no OAuth.

**Approvals:** every mutation (sends, segment and variable changes, notification subscriptions) asks for approval. Sends reach real chatbot users and cannot be undone. `segmentId` 0 on the segment dispatch tools means all users of the bot.

**Icon:** Chatforma's official logo (speech bubble with wordmark) from its website, with the "part of Stream Telecom" lines cropped out. No standalone mark was found in the sources checked (not independently verified against Simple Icons).

**Gaps:** the vendor API is small (25 operations: 24 data operations plus GET /auth-test) and not documented beyond the Swagger file; response shapes are returned as raw JSON, and the exact body of `DELETE` calls follows the Swagger file. No credentialed call was made.
