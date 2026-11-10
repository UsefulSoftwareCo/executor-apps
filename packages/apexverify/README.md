# ApexVerify

Verify and normalize email addresses and phone numbers, one at a time or in uploaded batches, and read account credit balances.

- Interface: OpenAPI, the vendor's own document at https://api.apexverify.com/openapi.json (interactive docs at https://api.apexverify.com/docs).
- Auth: API key, sent as the `X-API-Key` header. The vendor's OpenAPI declares the `X-API-Key` scheme but does not document where keys are issued; get one from your ApexVerify account at https://apexverify.com.
- Approvals: every mutation (single verification, which spends credits, batch create/launch/update/delete, format) requires approval.
- Icon: the vendor's official 512x512 app icon, https://apexverify.com/android-chrome-512x512.png (the vendor publishes no press/brand page or standalone SVG mark; its og logo is a wide wordmark). The dark-theme variant is an RGB inversion made by scripts/icon.ts.
- Gaps: no OAuth; the API offers none.
