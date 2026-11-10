import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const alchemy = defineProvider({
  name: "Alchemy",
  hosts: ["*.g.alchemy.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // eth_blockNumber on Ethereum mainnet: needs the key to be valid and the app to allow that network.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${encodeURIComponent(account.fields.token)}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    });
    await decodeJson(response, object({ result: string() }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const networkPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The network is a hostname label (eth-mainnet, base-sepolia, solana-mainnet, ...). Reject anything
// that could redirect the key to another host.
function host(network: string) {
  if (!networkPattern.test(network)) throw new Error(`Invalid Alchemy network "${network}"`);
  return `https://${network}.g.alchemy.com`;
}

function client(key: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const k = encodeURIComponent(key);

  async function send(url: string, init: { method: "GET" | "POST"; body?: unknown }) {
    const response = await fetcher(url, {
      method: init.method,
      signal,
      headers: init.body === undefined ? {} : { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  }

  async function rpc(network: string, method: string, params: unknown[] = []) {
    const result = (await send(`${host(network)}/v2/${k}`, {
      method: "POST",
      body: { jsonrpc: "2.0", id: 1, method, params },
    })) as { result?: unknown; error?: { code: number; message: string; data?: unknown } };
    if (result.error) throw new Error(`Alchemy RPC ${method}: ${result.error.message} (code ${result.error.code})`);
    return result.result ?? null;
  }

  // NFT API v3 reads. Arrays are sent as repeated key[] parameters.
  async function nftGet(network: string, path: string, params: Params = {}) {
    const url = new URL(`${host(network)}/nft/v3/${k}/${path}`);
    for (const [name, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${name}[]`, String(item));
      else url.searchParams.set(name, String(value));
    }
    return send(url.toString(), { method: "GET" });
  }

  const nftPost = (network: string, path: string, body: unknown) =>
    send(`${host(network)}/nft/v3/${k}/${path}`, { method: "POST", body });

  // Prices API and Data (Portfolio) API both live on api.g.alchemy.com.
  const prices = (path: string, init: { method: "GET" | "POST"; body?: unknown; query?: Params }) => {
    const url = new URL(`https://api.g.alchemy.com/prices/v1/${k}${path}`);
    for (const [name, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(name, String(item));
      else url.searchParams.set(name, String(value));
    }
    return send(url.toString(), init);
  };
  const data = (path: string, body: unknown) =>
    send(`https://api.g.alchemy.com/data/v1/${k}${path}`, { method: "POST", body });

  return { rpc, nftGet, nftPost, prices, data };
}

type Client = ReturnType<typeof client>;

const Network = string({ minLength: 1 });
const networkNote = "network is the Alchemy network slug, for example eth-mainnet, base-mainnet, arb-mainnet, polygon-mainnet, opt-mainnet.";

// RPC reads: tool name, JSON-RPC method, description, parameter names in positional order.
const rpcReads: readonly [string, string, string][] = [
  ["blockNumber", "eth_blockNumber", "Latest block number (hex)."],
  ["chainId", "eth_chainId", "Chain id (hex)."],
  ["gasPrice", "eth_gasPrice", "Current gas price in wei (hex)."],
  ["maxPriorityFeePerGas", "eth_maxPriorityFeePerGas", "Suggested max priority fee per gas in wei (hex)."],
  ["getBalance", "eth_getBalance", "Native token balance of an address in wei. params: [address, blockTag?] (blockTag defaults to latest)."],
  ["getTransactionCount", "eth_getTransactionCount", "Nonce of an address. params: [address, blockTag?]."],
  ["getCode", "eth_getCode", "Contract bytecode at an address. params: [address, blockTag?]."],
  ["getStorageAt", "eth_getStorageAt", "Storage slot of a contract. params: [address, slot, blockTag?]."],
  ["getBlockByNumber", "eth_getBlockByNumber", "Block by number or tag. params: [blockNumberOrTag, fullTransactions]."],
  ["getBlockByHash", "eth_getBlockByHash", "Block by hash. params: [blockHash, fullTransactions]."],
  ["getTransactionByHash", "eth_getTransactionByHash", "Transaction by hash. params: [txHash]."],
  ["getTransactionReceipt", "eth_getTransactionReceipt", "Receipt (status, gas used, logs) for a mined transaction. params: [txHash]."],
  ["getLogs", "eth_getLogs", "Event logs. params: [{ fromBlock, toBlock, address, topics }]."],
  ["call", "eth_call", "Execute a read-only contract call. params: [{ to, data, from? }, blockTag?]."],
  ["estimateGas", "eth_estimateGas", "Estimate gas for a transaction. params: [{ from?, to, data?, value? }]."],
  ["feeHistory", "eth_feeHistory", "Fee history. params: [blockCount, newestBlock, rewardPercentiles?]."],
  ["getBlockReceipts", "eth_getBlockReceipts", "All receipts of a block. params: [blockNumberOrTag]."],
];

// Alchemy-specific JSON-RPC methods.
const enhancedReads: readonly [string, string, string][] = [
  ["getAssetTransfers", "alchemy_getAssetTransfers", "Historical transfers (external, internal, erc20, erc721, erc1155, specialnft) for an address. params: [{ fromBlock?, toBlock?, fromAddress?, toAddress?, category: [...], withMetadata?, maxCount?, pageKey? }]."],
  ["getTokenBalances", "alchemy_getTokenBalances", "ERC-20 balances of an address. params: [address, 'erc20' | 'DEFAULT_TOKENS' | [contractAddresses], { pageKey? }?]."],
  ["getTokenMetadata", "alchemy_getTokenMetadata", "ERC-20 name, symbol, decimals, logo. params: [contractAddress]."],
  ["getTokenAllowance", "alchemy_getTokenAllowance", "ERC-20 allowance. params: [{ contract, owner, spender }]."],
  ["getTransactionReceipts", "alchemy_getTransactionReceipts", "Receipts for a block. params: [{ blockNumber } | { blockHash }]."],
  ["simulateAssetChanges", "alchemy_simulateAssetChanges", "Simulate a transaction and report the asset changes it would cause, without sending it. params: [{ from, to, value?, data? }, blockTag?]."],
  ["simulateExecution", "alchemy_simulateExecution", "Simulate a transaction and return its trace and logs, without sending it. params: [{ from, to, value?, data? }, blockTag?]."],
  ["traceTransaction", "trace_transaction", "Trace of a transaction. params: [txHash]."],
  ["traceBlock", "trace_block", "Traces of every transaction in a block. params: [blockNumberOrTag]."],
  ["debugTraceTransaction", "debug_traceTransaction", "Debug trace of a transaction. params: [txHash, { tracer? }?]."],
];

function rpcTools(c: Client) {
  const build = (entries: readonly [string, string, string][]) =>
    Object.fromEntries(
      entries.map(([name, method, description]) => [
        name,
        query(
          {
            description: `${description} JSON-RPC method ${method}. ${networkNote}`,
            input: object({ network: Network, params: json().optional() }),
          },
          async (_ctx, { network, params }) => c.rpc(network, method, Array.isArray(params) ? params : []),
        ),
      ]),
    );
  return router(
    {
      ...build(rpcReads),
      ...build(enhancedReads),
      sendRawTransaction: mutation(
        {
          description: `Broadcast a signed transaction (eth_sendRawTransaction). params: [signedTxHex]. Returns the transaction hash. ${networkNote}`,
          input: object({ network: Network, params: json() }),
          approval: always(),
        },
        async (_ctx, { network, params }) => c.rpc(network, "eth_sendRawTransaction", Array.isArray(params) ? params : []),
      ),
      call_any: mutation(
        {
          description: `Call any JSON-RPC method the network supports, including Solana, chain-specific and write methods. Use the typed tools for common reads. ${networkNote}`,
          input: object({ network: Network, method: string({ minLength: 1 }), params: json().optional() }),
          approval: always(),
        },
        async (_ctx, { network, method, params }) => c.rpc(network, method, Array.isArray(params) ? params : []),
      ),
    },
    {
      title: "JSON-RPC",
      description: "Node API: Ethereum-compatible JSON-RPC, Alchemy enhanced methods, tracing and simulation on any Alchemy network.",
    },
  );
}

// NFT API v3 read endpoints: tool name, path, description. Parameters go in params.
const nftReads: readonly [string, string, string][] = [
  ["getNFTsForOwner", "getNFTsForOwner", "NFTs owned by an address. params: owner, contractAddresses[], withMetadata, pageKey, pageSize, excludeFilters[] (SPAM, AIRDROPS), includeFilters[], orderBy."],
  ["getNFTsForContract", "getNFTsForContract", "All NFTs of a contract. params: contractAddress, withMetadata, startToken, limit."],
  ["getNFTsForCollection", "getNFTsForCollection", "All NFTs of an OpenSea collection. params: collectionSlug, withMetadata, startToken, limit."],
  ["getNFTMetadata", "getNFTMetadata", "Metadata of one NFT. params: contractAddress, tokenId, tokenType, refreshCache."],
  ["getContractMetadata", "getContractMetadata", "Metadata of an NFT contract. params: contractAddress."],
  ["getOwnersForNFT", "getOwnersForNFT", "Owners of an NFT. params: contractAddress, tokenId."],
  ["getOwnersForContract", "getOwnersForContract", "Owners of every NFT in a contract. params: contractAddress, withTokenBalances, block, pageKey."],
  ["getContractsForOwner", "getContractsForOwner", "NFT contracts an address holds tokens of. params: owner, pageKey, pageSize, excludeFilters[], includeFilters[], orderBy."],
  ["getFloorPrice", "getFloorPrice", "Floor price of a collection on NFT marketplaces. params: contractAddress or collectionSlug."],
  ["isSpamContract", "isSpamContract", "Whether a contract is classified as spam. params: contractAddress."],
];

function nftTools(c: Client) {
  const reads = Object.fromEntries(
    nftReads
      .map(([name, path, description]) => [
        name,
        query(
          {
            description: `${description} ${networkNote}`,
            input: object({ network: Network, params: record(json()).optional() }),
          },
          async (_ctx, { network, params }) => c.nftGet(network, path, params ?? {}),
        ),
      ]),
  );
  return router(
    {
      ...reads,
      getNFTMetadataBatch: query(
        {
          description: `Metadata for up to 100 NFTs. body: { tokens: [{ contractAddress, tokenId, tokenType? }], tokenUriTimeoutInMs?, refreshCache? }. ${networkNote}`,
          input: object({ network: Network, body: record(json()) }),
        },
        async (_ctx, { network, body }) => c.nftPost(network, "getNFTMetadataBatch", body),
      ),
      getContractMetadataBatch: query(
        {
          description: `Metadata for multiple NFT contracts. body: { contractAddresses: [...] }. ${networkNote}`,
          input: object({ network: Network, body: record(json()) }),
        },
        async (_ctx, { network, body }) => c.nftPost(network, "getContractMetadataBatch", body),
      ),
      reportSpam: mutation(
        {
          description: `Report a contract as spam or not spam. params: address (contract), isSpam (true to flag as spam, false to unflag). ${networkNote}`,
          input: object({ network: Network, address: string({ minLength: 1 }), isSpam: boolean() }),
          approval: always(),
        },
        async (_ctx, { network, address, isSpam }) => c.nftGet(network, "reportSpam", { address, isSpam }),
      ),
      refreshNftMetadata: mutation(
        {
          description: `Ask Alchemy to refresh the cached metadata of one NFT (Ethereum, Polygon, Arbitrum, Optimism and Base mainnets, plus Ethereum Sepolia and Polygon Amoy). ${networkNote}`,
          input: object({ network: Network, contractAddress: string({ minLength: 1 }), tokenId: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { network, contractAddress, tokenId }) =>
          c.nftPost(network, "refreshNftMetadata", { contractAddress, tokenId }),
      ),
    },
    { title: "NFT API", description: "NFT ownership, metadata, collections, sales, floor prices, spam and rarity." },
  );
}

function pricesTools(c: Client) {
  return router(
    {
      bySymbol: query(
        {
          description: "Current prices for up to 25 tokens by symbol (for example ETH, BTC, USDC).",
          input: object({ symbols: json() }),
        },
        async (_ctx, { symbols }) =>
          c.prices("/tokens/by-symbol", { method: "GET", query: { symbols: Array.isArray(symbols) ? symbols : [symbols] } }),
      ),
      byAddress: query(
        {
          description:
            "Current prices for tokens by network and contract address. body: { addresses: [{ network: 'eth-mainnet', address: '0x...' }] }.",
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => c.prices("/tokens/by-address", { method: "POST", body }),
      ),
      historical: query(
        {
          description:
            "Historical prices for one token. body: { symbol | network + address, startTime, endTime, interval: '5m' | '1h' | '1d', currency? }. Times are ISO 8601 or Unix seconds.",
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => c.prices("/tokens/historical", { method: "POST", body }),
      ),
    },
    { title: "Prices", description: "Current and historical token prices by symbol or contract address." },
  );
}

function portfolioTools(c: Client) {
  const post = (name: string, path: string, description: string) => [
    name,
    query(
      { description, input: object({ body: record(json()) }) },
      async (_ctx, { body }) => c.data(path, body),
    ),
  ] as const;
  return router(
    Object.fromEntries([
      post(
        "tokensByAddress",
        "/assets/tokens/by-address",
        "Tokens held by wallet addresses across networks, with metadata and prices. body: { addresses: [{ address, networks: ['eth-mainnet'] }], withMetadata?, withPrices?, includeNativeTokens?, includeErc20Tokens?, pageKey? }.",
      ),
      post(
        "tokenBalancesByAddress",
        "/assets/tokens/balances/by-address",
        "Token balances (without metadata) for wallet addresses across networks. body: { addresses: [{ address, networks }], includeNativeTokens?, includeErc20Tokens?, pageKey? }.",
      ),
      post(
        "nftsByAddress",
        "/assets/nfts/by-address",
        "NFTs owned by wallet addresses across networks. body: { addresses: [{ address, networks, excludeFilters? }], withMetadata?, pageKey?, pageSize? }.",
      ),
      post(
        "nftContractsByAddress",
        "/assets/nfts/contracts/by-address",
        "NFT contracts that wallet addresses hold tokens of. body: { addresses: [{ address, networks }], withMetadata?, pageKey? }.",
      ),
      post(
        "transfersByAddress",
        "/transfers/by-address",
        "Transfer history for ONE wallet address (flat body, not addresses[]). body: { address, networks: ['eth-mainnet'] (max 5), category: ['external'|'internal'|'erc20'|'erc721'|'erc1155'|'specialnft'] (required), direction?: 'to'|'from'|'both' (default both), fromTimestamp?, toTimestamp? (ISO-8601), order?: 'asc'|'desc' (default desc), contractAddresses?, excludeZeroValue?, maxCount? (default 100), pageKey? }.",
      ),
    ]),
    { title: "Portfolio", description: "Multi-chain wallet tokens, balances, NFTs and transfer history." },
  );
}

export default defineApp(
  { user: { accounts: { alchemy: alchemy.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.alchemy ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            rpc: rpcTools(c),
            nft: nftTools(c),
            prices: pricesTools(c),
            portfolio: portfolioTools(c),
          });
        },
        { signal },
      ),
      {
        title: "Alchemy",
        description:
          "Blockchain data on 80+ networks: JSON-RPC and enhanced node methods, NFT API, token prices, and multi-chain portfolio data.",
        instructions:
          "Every tool that targets a chain takes a network slug such as eth-mainnet or base-mainnet. Prefer the portfolio tools for multi-chain wallet views and rpc.* for a single chain. Prices and portfolio tools take a body object as documented in each tool description.",
        icons,
      },
    ),
  }),
);
