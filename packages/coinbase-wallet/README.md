# Coinbase Wallet

Coinbase Wallet (the self-custody wallet behind the Base app): inspect balances and portfolio,
send funds, swap tokens, sign messages, run batched contract calls and pay x402-enabled APIs
across supported networks.

**Interface:** Coinbase's official remote MCP server, `https://wallet-mcp.coinbase.com`
(https://docs.cdp.coinbase.com/coinbase-for-agents/wallet-mcp/skill). Older docs name the same
server `https://mcp.base.org`; its OAuth metadata body was compared and differs only in the
host (issuer and endpoints), with identical scopes, PKCE and public-client settings. Coinbase publishes no OpenAPI
document for it. The tool list is whatever the server advertises for the account (it requires
credentials, so no count was enumerated).

**Auth:** OAuth only. The server publishes RFC 8414 metadata and dynamic client registration
(public client, PKCE S256), so Executor registers its own client; no key or app needs to be
created. The requested scope is `agent_wallet:transact`; the server also offers
`agent_wallet:escalate`, deliberately not requested. Coinbase's docs (install and approval-mode
references) do not define either scope, so whether `transact` covers every write tool is
unconfirmed; they say each write returns an approval URL the user approves in the wallet. If a
connected account lacks send/swap tools, add `agent_wallet:escalate` in `index.ts`. Write tools may additionally return an
approval URL that must be approved in the Coinbase wallet before the action executes.

**Approvals:** every tool the server does not mark read-only asks for approval in Executor.

**Known gaps:** account health only verifies the token reaches the MCP server. This is separate
from `coinbase` (Advanced Trade API) and from Coinbase for Agents (`agents.coinbase.com/mcp`).

**Icon:** the Base square mark from Coinbase's official Base brand kit
(https://brand.base.org/base-brand.zip, `The Square/Base_square_blue.svg`). Coinbase publishes no
separate Coinbase Wallet SVG and the product is being rebranded as the Base app.
