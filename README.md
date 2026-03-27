# SolDeFi Agent — Nosana x ElizaOS Challenge

AI-powered Solana DeFi assistant built with ElizaOS v2, deployed on Nosana's decentralized GPU network.

## What It Does

- **Token Analysis** — Paste any Solana token address to get safety analysis: price, liquidity, volume, buy/sell ratio, risk level, and warnings
- **Wallet Tracking** — Monitor any wallet's recent transactions via Helius API
- **Trending Tokens** — See currently promoted/boosted tokens on DexScreener

## Architecture

```
ElizaOS Agent (TypeScript)
├── Token Analyzer (DexScreener API)
├── Wallet Tracker (Helius API)  
├── Trending Scanner (DexScreener Boosts API)
└── Web UI (ElizaOS built-in)
```

All tools use real on-chain data. No mock data.

## Setup

```bash
git clone https://github.com/TateLyman/agent-challenge
cd agent-challenge
git checkout elizaos-challenge
cp .env.example .env
bun install
bun run dev
```

Open http://localhost:3000 to interact with the agent.

## Deploy on Nosana

```bash
docker build -t yourusername/soldefi-agent .
docker push yourusername/soldefi-agent
nosana job post --file ./nos_job_def/nosana_eliza_job_definition.json --market nvidia-4090
```

## Tech Stack

- ElizaOS v2 (agent framework)
- DexScreener API (token data)
- Helius API (wallet tracking)
- Nosana (decentralized GPU deployment)
- TypeScript

## Author

Built by TateLyman for the Nosana Builders Challenge #4.
