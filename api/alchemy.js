const SUPPORTED_NETWORKS = new Set([
  "base-mainnet", "eth-mainnet", "bnb-mainnet", "polygon-mainnet",
  "arb-mainnet", "opt-mainnet", "scroll-mainnet", "linea-mainnet",
  "zora-mainnet", "ink-mainnet", "robinhood-mainnet", "arc-mainnet"
]);
const RPC_METHODS = new Set(["eth_getBalance", "alchemy_getTokenBalances", "alchemy_getTokenMetadata"]);
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return send(response, 405, { error: "Method not allowed." });

  const { type, network, method, params, owner, pageKey } = request.body || {};
  const key = process.env.ALCHEMY_KEY;
  if (!key) return send(response, 500, { error: "The server is missing its Alchemy configuration." });
  if (!SUPPORTED_NETWORKS.has(network)) return send(response, 400, { error: "Unsupported network." });

  let url;
  let options;
  if (type === "rpc") {
    if (!RPC_METHODS.has(method)) return send(response, 400, { error: "Unsupported RPC method." });
    url = `https://${network}.g.alchemy.com/v2/${key}`;
    options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params })
    };
  } else if (type === "nft") {
    if (!ADDRESS.test(owner || "")) return send(response, 400, { error: "Invalid wallet address." });
    const query = new URLSearchParams({ owner, withMetadata: "true", pageSize: "100" });
    if (typeof pageKey === "string" && pageKey) query.set("pageKey", pageKey);
    url = `https://${network}.g.alchemy.com/nft/v3/${key}/getNFTsForOwner?${query}`;
    options = { headers: { Accept: "application/json" } };
  } else {
    return send(response, 400, { error: "Unsupported request type." });
  }

  try {
    const upstream = await fetch(url, options);
    const body = await upstream.json();
    return send(response, upstream.status, body);
  } catch (error) {
    console.error("Alchemy proxy request failed", error);
    return send(response, 502, { error: "Unable to contact Alchemy." });
  }
};
