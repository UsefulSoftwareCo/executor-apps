# Adafruit IO

Adafruit IO is Adafruit's cloud service for storing, visualizing and acting on IoT device data. This package covers its REST API: feeds, data points, groups, dashboards, blocks, triggers, permissions, tokens, webhooks and user info (69 tools, 40 of them mutations that require approval).

**Interface:** OpenAPI. Adafruit's official Swagger 2.0 document at https://io.adafruit.com/api/docs/v2.json, converted by the framework. The document refers to shared `in: body` parameters in a way the converter cannot resolve, so `openapi.ts` inlines them with static patches (schemas identical to the spec's; descriptions and examples added to some bodies). MQTT is not covered.

**Auth:** API key only. Adafruit IO has no OAuth for third-party apps. Use your Adafruit IO key (the `X-AIO-Key` described in the API docs at https://io.adafruit.com/api/docs/); it is sent as the `X-AIO-Key` header to `io.adafruit.com`. The per-request `X-AIO-Signature` scheme is not supported.

**Known gaps:** MQTT streaming, and the Signature auth variant. The two webhook operations (`createWebhookFeedData`, `createRawWebhookFeedData`) are excluded: the spec declares `/webhooks/feed/:token` without a path parameter, so the token could not be supplied, and the endpoints do not use the account key. The icon is the Adafruit IO mark taken from the vendor's own web app assets (io-logo-black.svg served by io.adafruit.com).
