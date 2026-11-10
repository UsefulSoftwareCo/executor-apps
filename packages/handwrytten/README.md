# Handwrytten

Send real handwritten cards through Handwrytten: browse cards, fonts and gift cards, manage the address book and recipients, build baskets and place or cancel orders, create custom cards and QR codes, and run bulk outbound campaigns.

**Interface:** OpenAPI 3.0 document published by Handwrytten (v3.15.0) at https://www.handwrytten.com/openapi.json, documented at https://www.handwrytten.com/api/. Calls go to `https://api.handwrytten.com/v2`. The document also lists `api2.handwrytten.com`; that origin is not allowed.

**Auth:** API key. Create one in the Handwrytten dashboard under Account Settings, Integrations (https://app.handwrytten.com/integrations). The key is sent as the raw `Authorization` header value, with no `Bearer` prefix. Handwrytten has no OAuth for third-party apps.

**Known gaps:** The deprecated login/password `uid` flow (`auth_authorization`, `auth_logout`) is removed so credentials never pass through tool arguments; 48 non-deprecated tools remain. Mutations (placing orders, sending baskets) cost money and always require approval. Health check uses `GET /auth/getUser`.
