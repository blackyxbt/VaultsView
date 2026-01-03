# 🧭 VaultsView - The Multi-Chain Asset Viewer

**VaultsView** is a clean, open-source tool that lets you check on any wallet’s holdings like tokens or NFTs across multiple blockchains at once.  
  No need to visit multiple sites. No wallet passwords. No complex UI. Just copy paste address.

---

## 💡 Current Features

- Scan Multiple Chains balance in one page ( currently 10 Chains )
- Sort tokens according to price or value or token name
- Real time token prices with precised values
- last but not least beginner friendly UI
- Shows NFTs you forgot you minted back in past and forgot.

---

## ⚡ Why over blockscans & wallets

- We don't pop-up or navigate to pages or multiple explorers or ask connect a wallet
- Unlike traditional blockscans that bury simple balance behind complex UIs
- We don't fail to List every token that evm wallets fails to fetch
- Now you don't need to rerpeatedly enter wallet passwords just to check balance
- We Worked with speed and perfection in mind  

---

## 🪄 How this works

-  **Multi-Chain Support** > Base, Ethereum, BNB, Polygon, Arbitrum, Optimism, Scroll, Linea, Zora, and even Ink (experimental because... why not).  
-  **Token Balances** > Instantly fetches native + ERC-20 tokens with live prices and USD values.  
-  **NFT Viewer** > Shows NFTs you forgot you minted back in past.  
-  **No API keys needed (for users)** — Everything happens client-side.  
-  **Lightning Fast** — Worked with speed and perfection in mind.  
-  **Developer Friendly** — The code is cleaner than most smart contracts out there.

---

## 🧱 Tech we used

-  **HTML + TailwindCSS** For the smooth UI that doesn’t burn your eyes.  
-  **JavaScript (Vanilla)** No frameworks, no excuses.  
-  **Alchemy RPC & NFT API** For token and nft fetching.  
-  **DexScreener + CoinGecko** For live token prices that make your bags look richer (or poor).  

---

## 🧰 How to Use

0. **Use direclty on web** visit https://vaultsview.vercel.app/

1. **Clone this if you want your own**
   ```bash
   git clone https://github.com/blackyxbt/VaultsView.git
   cd VaultsView

2. **Add your Alchemy key**
  Open js/app.js and find this line:
   ```bash
   const ALCHEMY_API_KEY = "YOUR_API_KEY_HERE";

3. **Run it locally**  
   Just open `index.html` in your browser — or go fancy:  
   ```bash
   python3 -m http.server
   
  Then visit http://localhost:8000
  
4. **Enter a wallet address*** and boom — 8+ chains in your hands

---

## 🪄 How It Works

1. You enter a wallet address.  
2. The app fetches token balances and NFTs via **Alchemy’s API**.  
3. Token prices come from **DexScreener** and **CoinGecko**.  
4. Everything renders clearly in **TailwindCSS** — no backend needed.

Basically:  
`input wallet` →  `fetch data` →  `display everything `.

---
