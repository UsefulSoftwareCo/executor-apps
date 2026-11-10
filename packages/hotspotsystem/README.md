# HotspotSystem

Read-only access to a HotspotSystem Wi-Fi hotspot account: the account profile, locations, location options, customers, subscribers, vouchers, and MAC, voucher, social and paid transactions (account-wide or per location).

Interface: the vendor's official API v2.0 Swagger document, https://www.hotspotsystem.com/apidocs/src/hss_v2_swagger.json (18 operations, all GET, so no approvals are needed). API reference: https://www.hotspotsystem.com/apidocs/api/notes/.

Auth: API key. Create it in the HotspotSystem Control Center under Tools & Settings > API Keys (https://www.hotspotsystem.com/controlcenter/api.php). The key is sent in the `sn-apikey` header, as in the spec and the vendor's samples. The docs also mention HTTP Basic auth, which this package does not use. There is no OAuth.

Known gaps: The v2.0 API publishes no write operations, so creating vouchers or subscribers is not covered. Icon: the vendor's official apple-touch-icon (152px PNG), as no SVG is published.
