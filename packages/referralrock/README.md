# Referral Rock

Referral marketing platform. This package covers programs, members, referrals, rewards and reward rules, payouts, the customer feed, webhook subscriptions and the email unsubscribe list (34 tools).

## Interface

Hand-written tools over the official REST API at https://api.referralrock.com (reference: https://api.referralrock.com/help). Referral Rock publishes no OpenAPI document and no MCP server; the docs site (https://docs.referralrock.com) lists none either. Tools take filters in `query` and request fields in `body`, named as in the reference. All mutations require approval.

## Auth

API keys only, sent as HTTP Basic. The vendor reference (https://api.referralrock.com/help) says only "All endpoints require basic authentication". Unverified: the vendor's reachable docs do not state which key is the Basic username and which is the password, nor where in the Referral Rock UI the keys are created. This package assumes the public key is the username and the private key is the password, and that keys live under Settings, API Keys (private key shown once). Confirm against a real account; if the mapping is reversed, swap it in `authorization()` in index.ts. No OAuth is offered for this API as far as the published docs show; none is implemented.

## Known gaps

- Request and response shapes are passed through as JSON rather than typed, since there is no machine-readable spec.
- Deprecated `referrals/status` and `invitefeed` are included and marked in their descriptions; v1 hook history and the DELETE duplicates of POST removals are left out.
- `payouts.list` takes a path id exactly as in the reference, which does not say what it denotes.
- Deprecated `POST api/memberaccess` is omitted; its replacement `POST api/memberaccessurls` is covered as `accessUrls`.
