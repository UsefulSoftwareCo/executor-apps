# Viral Loops

Referral marketing on Viral Loops: campaign info and stats, registering, editing, querying and searching participants, referrals and referrers, order and rank, flagging, conversions, and pending and given rewards (16 tools).

## Interface

Hand-written router over the Viral Loops REST API v3 (`https://app.viral-loops.com/api/v3`). Viral Loops publishes per-endpoint OpenAPI fragments in its docs (https://developers.viral-loops.com/llms.txt) but no single document at a stable URL, so the operations are listed by hand from those pages. Tools take an optional `query` object and, for writes, a `body` object. Mutations require approval. This package covers all 16 documented endpoints.

## Auth

- Campaign API token: the secret `apiToken` of one campaign, sent in the `apiToken` header and scoped to that campaign; add one account per campaign. Viral Loops' API reference only says "Where to find it?" without naming a page; in the dashboard it is believed to be on the campaign's Installation step, which is unconfirmed. No OAuth is documented by Viral Loops.
- Registering a participant (`participants.register`) also requires the campaign's separate `publicToken` in the request body; it is not the secret `apiToken` stored in the account.
- Edit participant (`participants.edit`) also sends the token in the body, as the vendor schema requires.

## Known gaps

- Each account reaches only the campaign that owns its token.
- The icon is Viral Loops' official blue circle logo (400px PNG from its docs site), since Simple Icons lacks it.
