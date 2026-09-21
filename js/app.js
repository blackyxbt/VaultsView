const REQUEST_TIMEOUT = 15000;
const ALCHEMY_API_PATH = "/api/alchemy";

const CHAINS = {
  base: { name: "Base", symbol: "ETH", rpc: "base-mainnet", nft: "base-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  ethereum: { name: "Ethereum", symbol: "ETH", rpc: "eth-mainnet", nft: "eth-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  bnb: { name: "BNB Smart Chain", symbol: "BNB", rpc: "bnb-mainnet", nft: "bnb-mainnet", price: "binancecoin", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
  polygon: { name: "Polygon", symbol: "MATIC", rpc: "polygon-mainnet", nft: "polygon-mainnet", price: "matic-network", image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png" },
  arbitrum: { name: "Arbitrum", symbol: "ETH", rpc: "arb-mainnet", nft: "arb-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  optimism: { name: "Optimism", symbol: "ETH", rpc: "opt-mainnet", nft: "opt-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  scroll: { name: "Scroll", symbol: "ETH", rpc: "scroll-mainnet", nft: "scroll-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  linea: { name: "Linea", symbol: "ETH", rpc: "linea-mainnet", nft: "linea-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  zora: { name: "Zora", symbol: "ETH", rpc: "zora-mainnet", nft: "zora-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  ink: { name: "Ink", symbol: "ETH", rpc: "ink-mainnet", nft: "ink-mainnet", price: "eth", image: "https://inkonchain.com/logo/ink-mark-dark.webp" },
  robinhood: { name: "Robinhood Chain", symbol: "ETH", rpc: "robinhood-mainnet", nft: "robinhood-mainnet", price: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  arc: { name: "Arc", symbol: "USDC", rpc: "arc-mainnet", nft: "arc-mainnet", price: "usd-coin", image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png" }
};

const assetForm = document.getElementById("asset-form");
const walletInput = document.getElementById("wallet-address");
const chainSelect = document.getElementById("chain-select");
const resultsBox = document.getElementById("results-box");
const loadingBox = document.getElementById("loading-box");
const errorBox = document.getElementById("error-box");
const dataBox = document.getElementById("data-box");
const tokenSection = document.getElementById("token-section");
const nftSection = document.getElementById("nft-section");
const tabTokens = document.getElementById("tab-tokens");
const tabNfts = document.getElementById("tab-nfts");
const themeToggle = document.getElementById("theme-toggle");
const chainPicker = document.querySelector(".chain-picker");
const chainTrigger = document.getElementById("chain-trigger");
const chainMenu = document.getElementById("chain-menu");
const chainValue = document.getElementById("chain-value");

let visibleTokens = [];
let tokenWarning = "";
let sortState = { key: "value", ascending: false };
let activeScan = 0;

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The request timed out. Please try again.");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function rpc(network, method, params) {
  const response = await fetchJson(ALCHEMY_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "rpc", network, method, params })
  });
  if (response.error) throw new Error(response.error.message || "The network rejected this request.");
  return response.result;
}

function formatUnits(value, decimals = 18, maximumFractionDigits = 6) {
  try {
    const raw = BigInt(value || "0x0");
    const divisor = 10n ** BigInt(decimals);
    const whole = raw / divisor;
    const fraction = (raw % divisor).toString().padStart(decimals, "0").slice(0, maximumFractionDigits).replace(/0+$/, "");
    return fraction ? `${whole.toLocaleString()}.${fraction}` : whole.toLocaleString();
  } catch { return "0"; }
}

function numericUnits(value, decimals = 18) {
  try {
    const raw = BigInt(value || "0x0");
    const divisor = 10n ** BigInt(decimals);
    const whole = Number(raw / divisor);
    const remainder = Number(raw % divisor) / Number(divisor);
    return whole + remainder;
  } catch { return 0; }
}

function safeText(value, fallback = "—") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function hueFrom(value) {
  const hash = Array.from(value || "V").reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0);
  return (hash >>> 0) % 360;
}

async function getNativePrice(chain) {
  const id = CHAINS[chain].price;
  const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
  return Number(data?.[id]?.usd) || 0;
}

async function getTokenPrice(address) {
  try {
    const data = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    return Number(data?.pairs?.find(pair => pair.priceUsd)?.priceUsd) || 0;
  } catch { return 0; }
}

async function settledMap(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try { results[index] = { status: "fulfilled", value: await mapper(items[index]) }; }
      catch (reason) { results[index] = { status: "rejected", reason }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function loadTokens(address, chain) {
  const config = CHAINS[chain];
  if (!config) throw new Error("Unsupported network.");
  const [nativeHex, balances] = await Promise.all([
    rpc(config.rpc, "eth_getBalance", [address, "latest"]),
    rpc(config.rpc, "alchemy_getTokenBalances", [address, "erc20"])
  ]);
  const nativeBalance = numericUnits(nativeHex);
  const tokens = [];
  if (nativeBalance > 0.00001) {
    const price = await getNativePrice(chain).catch(() => 0);
    tokens.push({ name: config.name, symbol: config.symbol, image: config.image, balance: formatUnits(nativeHex), price, value: nativeBalance * price });
  }

  const nonZero = (balances?.tokenBalances || []).filter(token => {
    try { return BigInt(token.tokenBalance || "0x0") > 0n; } catch { return false; }
  });
  const records = await settledMap(nonZero, 4, async token => {
    const [metadata, price] = await Promise.all([
      rpc(config.rpc, "alchemy_getTokenMetadata", [token.contractAddress]),
      getTokenPrice(token.contractAddress)
    ]);
    const decimals = Number(metadata.decimals);
    if (!Number.isInteger(decimals) || decimals < 0) return null;
    const amount = numericUnits(token.tokenBalance, decimals);
    return { name: safeText(metadata.name, "Unknown token"), symbol: safeText(metadata.symbol, "?"), image: metadata.logo, balance: formatUnits(token.tokenBalance, decimals, 4), price, value: amount * price, contract: token.contractAddress };
  });
  records.forEach(record => { if (record.status === "fulfilled" && record.value) tokens.push(record.value); });
  const failures = records.filter(record => record.status === "rejected").length;
  return {
    tokens,
    warning: failures ? `${failures} token${failures === 1 ? "" : "s"} could not be loaded. Try again if the wallet has more assets.` : ""
  };
}

async function loadNfts(address, chain) {
  const config = CHAINS[chain];
  if (!config) throw new Error("Unsupported network.");
  const nfts = [];
  let pageKey = "";
  do {
    const data = await fetchJson(ALCHEMY_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "nft", network: config.nft, owner: address, pageKey })
    });
    nfts.push(...(data.ownedNfts || []));
    pageKey = data.pageKey || "";
  } while (pageKey);
  return nfts.map(nft => ({
    name: safeText(nft.name, `${safeText(nft.contract?.name, "NFT")} #${nft.tokenId || ""}`),
    collection: safeText(nft.contract?.name, "Unknown collection"),
    image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.media?.[0]?.gateway || nft.media?.[0]?.raw || ""
  }));
}

function setLoading(loading) {
  resultsBox.classList.remove("hidden");
  loadingBox.classList.toggle("hidden", !loading);
  if (loading) { dataBox.classList.add("hidden"); errorBox.classList.add("hidden"); }
}

function showError(message) {
  resultsBox.classList.remove("hidden");
  loadingBox.classList.add("hidden");
  dataBox.classList.add("hidden");
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function formatMoney(value) {
  return Number.isFinite(value) && value > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 1 ? 4 : 2 }).format(value) : "—";
}

function tokenAvatar(token) {
  const holder = document.createElement("div");
  holder.className = "h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700";
  const initial = safeText(token.name, "?").charAt(0).toUpperCase();
  const fallback = () => { holder.textContent = initial; holder.className = "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm"; holder.style.background = `linear-gradient(135deg,hsl(${hueFrom(token.symbol)},80%,55%),hsl(${(hueFrom(token.symbol) + 55) % 360},80%,45%))`; };
  if (!token.image) { fallback(); return holder; }
  const image = document.createElement("img");
  image.src = token.image; image.alt = ""; image.className = "h-full w-full object-cover"; image.referrerPolicy = "no-referrer"; image.addEventListener("error", fallback, { once: true });
  holder.appendChild(image); return holder;
}

function drawTokens(tokens, warning = "") {
  tokenSection.replaceChildren();
  if (warning) { const notice = document.createElement("p"); notice.className = "mb-3 px-4 py-3 text-sm text-amber-300"; notice.textContent = warning; tokenSection.appendChild(notice); }
  if (!tokens.length) { const empty = document.createElement("p"); empty.className = "py-10 text-center text-slate-400"; empty.textContent = "No token balances found on this network."; tokenSection.appendChild(empty); return; }
  const table = document.createElement("table"); table.className = "min-w-full divide-y divide-slate-700";
  const header = document.createElement("thead"); const headerRow = document.createElement("tr");
  [["name", "Token"], [null, "Balance"], ["price", "Price (USD)"], ["value", "Value (USD)"]].forEach(([key, label]) => {
    const cell = document.createElement("th"); cell.className = "py-3.5 px-4 text-left text-sm font-semibold"; cell.textContent = label;
    if (key) { cell.classList.add("sortable", "cursor-pointer"); if (sortState.key === key) cell.textContent += sortState.ascending ? " ↑" : " ↓"; cell.addEventListener("click", () => { sortState = { key, ascending: sortState.key === key ? !sortState.ascending : false }; sortTokens(); }); }
    headerRow.appendChild(cell);
  });
  header.appendChild(headerRow); table.appendChild(header); const body = document.createElement("tbody"); body.className = "divide-y divide-slate-700";
  tokens.forEach(token => { const row = document.createElement("tr"); const tokenCell = document.createElement("td"); tokenCell.className = "whitespace-nowrap py-4 px-4"; const wrap = document.createElement("div"); wrap.className = "flex items-center gap-3"; wrap.appendChild(tokenAvatar(token)); const labels = document.createElement("div"); const name = document.createElement("div"); name.className = "font-medium text-white"; name.textContent = token.name; const symbol = document.createElement("div"); symbol.className = "text-sm text-slate-400"; symbol.textContent = token.symbol; labels.append(name, symbol); wrap.appendChild(labels); tokenCell.appendChild(wrap); row.appendChild(tokenCell);
    [[token.balance, "text-white"], [formatMoney(token.price), "text-slate-300"], [formatMoney(token.value), "text-cyan-400 font-semibold"]].forEach(([value, classes]) => { const cell = document.createElement("td"); cell.className = `py-4 px-4 ${classes}`; cell.textContent = value; row.appendChild(cell); }); body.appendChild(row); });
  table.appendChild(body); tokenSection.appendChild(table);
}

function sortTokens() {
  const sorted = [...visibleTokens].sort((left, right) => {
    const a = sortState.key === "name" ? left.name.toLowerCase() : Number(left[sortState.key]) || 0;
    const b = sortState.key === "name" ? right.name.toLowerCase() : Number(right[sortState.key]) || 0;
    const comparison = typeof a === "string" ? a.localeCompare(b) : a - b;
    return sortState.ascending ? comparison : -comparison;
  });
  drawTokens(sorted, tokenWarning);
}

function drawNfts(nfts, error = "") {
  nftSection.replaceChildren();
  if (error) { const notice = document.createElement("p"); notice.className = "py-10 text-center text-amber-300"; notice.textContent = `Collectibles could not be loaded: ${error}`; nftSection.appendChild(notice); return; }
  if (!nfts.length) { const empty = document.createElement("p"); empty.className = "py-10 text-center text-slate-400"; empty.textContent = "No collectibles found on this network."; nftSection.appendChild(empty); return; }
  const grid = document.createElement("div"); grid.className = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";
  nfts.forEach(nft => { const card = document.createElement("article"); card.className = "overflow-hidden bg-slate-700 shadow-lg transition-transform hover:scale-105"; const frame = document.createElement("div"); frame.className = "aspect-square bg-slate-600"; if (nft.image) { const image = document.createElement("img"); image.src = nft.image; image.alt = nft.name; image.className = "h-full w-full object-cover"; image.loading = "lazy"; image.referrerPolicy = "no-referrer"; image.addEventListener("error", () => image.remove(), { once: true }); frame.appendChild(image); } const info = document.createElement("div"); info.className = "p-3"; const title = document.createElement("h3"); title.className = "truncate font-bold text-white"; title.title = nft.name; title.textContent = nft.name; const collection = document.createElement("p"); collection.className = "truncate text-sm text-slate-400"; collection.title = nft.collection; collection.textContent = nft.collection; info.append(title, collection); card.append(frame, info); grid.appendChild(card); });
  nftSection.appendChild(grid);
}

function setTab(tab) {
  const tokens = tab === "tokens";
  tokenSection.classList.toggle("hidden", !tokens); nftSection.classList.toggle("hidden", tokens);
  tabTokens.classList.toggle("active", tokens); tabNfts.classList.toggle("active", !tokens);
  tabTokens.classList.toggle("text-white", tokens); tabNfts.classList.toggle("text-white", !tokens);
  tabTokens.classList.toggle("text-slate-400", !tokens); tabNfts.classList.toggle("text-slate-400", tokens);
}

async function onSearch(event) {
  event.preventDefault();
  const scanId = ++activeScan;
  const address = walletInput.value.trim(); const chain = chainSelect.value;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) { showError(address ? "Enter a valid 42-character EVM wallet address." : "Enter a wallet address to continue."); return; }
  if (!CHAINS[chain]) { showError("Choose a supported network."); return; }
  setLoading(true);
  try {
    const [tokensResult, nftsResult] = await Promise.allSettled([loadTokens(address, chain), loadNfts(address, chain)]);
    if (scanId !== activeScan) return;
    if (tokensResult.status === "rejected") throw tokensResult.reason;
    visibleTokens = tokensResult.value.tokens; tokenWarning = tokensResult.value.warning; drawTokens(visibleTokens, tokenWarning);
    drawNfts(nftsResult.status === "fulfilled" ? nftsResult.value : [], nftsResult.status === "rejected" ? (nftsResult.reason?.message || "Unknown error") : "");
    loadingBox.classList.add("hidden"); dataBox.classList.remove("hidden"); setTab("tokens");
  } catch (error) { if (scanId !== activeScan) return; console.error("Wallet scan failed", error); showError(error.message || "Unable to load this wallet. Please try again."); }
}

function applyTheme(theme) {
  const light = theme === "light"; document.documentElement.dataset.theme = light ? "light" : "dark";
  themeToggle?.setAttribute("aria-checked", String(light)); themeToggle?.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
}

function closeChainMenu() { chainPicker?.classList.remove("open"); chainMenu?.classList.add("hidden"); chainTrigger?.setAttribute("aria-expanded", "false"); }
function chooseChain(value, label) { chainSelect.value = value; chainValue.textContent = label; chainMenu.querySelectorAll(".chain-option").forEach(button => button.setAttribute("aria-selected", String(button.dataset.value === value))); closeChainMenu(); }
function initChainPicker() {
  if (!chainPicker || !chainTrigger || !chainMenu || !chainValue) return;
  Array.from(chainSelect.options).forEach(option => { const button = document.createElement("button"); button.type = "button"; button.className = "chain-option"; button.dataset.value = option.value; button.setAttribute("role", "option"); button.setAttribute("aria-selected", String(option.selected)); button.textContent = option.text; button.addEventListener("click", () => chooseChain(option.value, option.text)); chainMenu.appendChild(button); });
  chainTrigger.addEventListener("click", () => { const open = chainPicker.classList.toggle("open"); chainMenu.classList.toggle("hidden", !open); chainTrigger.setAttribute("aria-expanded", String(open)); });
  document.addEventListener("click", event => { if (!chainPicker.contains(event.target)) closeChainMenu(); });
  chainTrigger.addEventListener("keydown", event => { if (event.key === "Escape") closeChainMenu(); if (event.key === "ArrowDown") { event.preventDefault(); if (chainMenu.classList.contains("hidden")) chainTrigger.click(); chainMenu.querySelector(".chain-option[aria-selected='true']")?.focus(); } });
}

assetForm.addEventListener("submit", onSearch);
tabTokens.addEventListener("click", () => setTab("tokens")); tabNfts.addEventListener("click", () => setTab("nfts"));
const storedTheme = (() => { try { return localStorage.getItem("vaultsview-theme"); } catch { return null; } })();
applyTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
themeToggle?.addEventListener("click", () => { const next = document.documentElement.dataset.theme === "light" ? "dark" : "light"; try { localStorage.setItem("vaultsview-theme", next); } catch {} applyTheme(next); });
initChainPicker();
