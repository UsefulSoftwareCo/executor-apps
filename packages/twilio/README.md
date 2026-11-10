# Twilio

Twilio's communications APIs: SMS/MMS, voice calls, phone numbers, Verify, Lookup, Messaging services and A2P registration, Conversations, Content, Studio, TaskRouter, Sync, Proxy, TrustHub, Video, Serverless, Elastic SIP Trunking, Wireless, Super SIM, Pricing, Events and Conversational Intelligence.

## Interface

OpenAPI. Twilio's official documents from https://github.com/twilio/twilio-oai (`spec/json/twilio_*.json`) are mounted one per API under its own key (`api`, `messaging`, `verify`, `lookups`, ...), each on its own `*.twilio.com` host. Roughly 940 operations across 22 specs; `api` (the 2010-04-01 core API) alone compiles to 197 tools. Mutations require approval.

## Auth

- API key (`apiKey`): HTTP Basic. Fields: Account SID (`AC...`, stored as a plain field), Username and Password. Either use the Account SID as Username and the Auth Token as Password, or an API Key SID (`SK...`) as Username and its secret as Password (recommended; create under Console > Account > API keys & tokens, https://console.twilio.com/us1/account/keys-credentials/api-keys). Main and Standard keys both work. The health check lists one message under the Account SID (`/Accounts/{AccountSid}/Messages.json`) because Standard keys cannot read the Accounts resource. Restricted keys work only if granted the Messages read permission. Most paths take the Account SID, so callers pass it as `AccountSid` on each call.

Twilio's OAuth bearer tokens (a few Verify operations declare an `access_token_bearer` scheme; those operations stay reachable through Basic) and OAuth (client credentials for its own OAuth apps) is in beta and limited to a few APIs, so it is not offered.

## Known gaps

- Only current versions of each API are mounted. Preview, Chat v1/v2, IP Messaging, Notify, Autopilot and other legacy or discontinued specs, plus the Flex, Insights, Marketplace, Memory, Knowledge, Routes, IAM and Accounts specs, are left out.
- Regional/edge hosts (`*.ie1.twilio.com`) are not used; all calls go to the default US1 hosts.
- Specs are fetched from the `main` branch of twilio-oai, not a pinned commit, so the tool set can change over time.
