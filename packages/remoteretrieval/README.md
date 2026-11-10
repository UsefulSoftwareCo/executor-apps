# Remote Retrieval

Schedule pickups of laptops, monitors, phones and tablets from remote staff (return to the company or recycle with data destruction), and track orders, shipments, company details and device prices.

**Interface:** hand-written tools over the Enterprise API documented at https://www.remoteretrieval.com/api-integration/ (base `https://www.remoteretrieval.com/api/v1`). Remote Retrieval publishes no OpenAPI document, only a Postman collection, so the 7 documented endpoints are wrapped directly: validate user, company details, device prices, list orders, get order, create order and create orders by CSV. Create operations require approval.

**Auth:** API key (`Authorization: Bearer <key>`). Keys come with an Enterprise account: sign up at https://www.remoteretrieval.com/enterprise and copy the key from the Enterprise Remote Retriever portal. There is no OAuth.

**Known gaps:** the vendor documents no error format, rate limits or order cancellation, so none are exposed. Order status filtering and per-page size are not supported by the documented API. Not verified against a live key.
