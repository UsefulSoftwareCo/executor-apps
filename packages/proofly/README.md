# Proofly

Proofly (https://proofly.io) is a social proof toolkit that shows real-time notifications such as recent purchases, reviews and visitor counts on websites. This package exposes its public REST API (v1.0, https://proofly.io/developers): user info, activity logs, campaign list, a campaign's notifications, per-notification leads and conversion data, and toggling a campaign on or off.

Interface: hand-written tools over the REST API at `https://proofly.io/api`. Proofly publishes no OpenAPI document, so the six documented endpoints are written by hand.

Auth: API key. Log in to Proofly and open https://proofly.io/developers, which shows your API key when you are logged in; it is sent as the `X-Api-Key` header. Proofly has no OAuth. Free accounts are rate limited to 10 requests per minute.

Known gaps: the API is read-only apart from toggling a campaign; it cannot create or edit campaigns or notifications. The toggle endpoint flips the current state rather than setting it.
