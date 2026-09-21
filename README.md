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

1. **Use it on the web**

   Visit <https://vaultsview.vercel.app/>.

2. **Clone it if you want your own copy**

   ```bash
   git clone https://github.com/blackyxbt/VaultsView.git
   cd VaultsView
   ```

3. **Add your Alchemy key**

   In your Vercel project settings, add an environment variable named `ALCHEMY_KEY`. It is read only by the serverless API route and is never sent to the browser.

4. **Run it locally**

   ```bash
   npx vercel dev
   ```

   Copy `.env.example` to `.env.local`, add your `ALCHEMY_KEY`, then visit the local URL printed by Vercel. The API proxy requires Vercel (or another serverless runtime); opening `index.html` directly will not work.

5. **Enter a wallet address** and scan its assets.

---

## 🪄 How It Works

1. You enter a wallet address.  
2. The app fetches token balances and NFTs via **Alchemy’s API**.  
3. Token prices come from **DexScreener** and **CoinGecko**.  
4. Everything renders clearly in **TailwindCSS** — no backend needed.

Basically:  
`input wallet` →  `fetch data` →  `display everything `.

---
