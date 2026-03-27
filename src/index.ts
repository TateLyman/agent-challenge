import { type Plugin, type Action, type ActionExample, type HandlerCallback, type IAgentRuntime, type Memory, type State } from "@elizaos/core";

// === TOKEN ANALYSIS ACTION ===
const analyzeTokenAction: Action = {
  name: "ANALYZE_TOKEN",
  description: "Analyze a Solana token for safety and market data using DexScreener API",
  similes: ["check token", "scan token", "is this token safe", "token info", "analyze"],
  examples: [[
    { user: "user1", content: { text: "Analyze token So11111111111111111111111111111111111111112" } },
    { user: "SolDeFi Agent", content: { text: "Analyzing SOL token..." } }
  ]] as ActionExample[][],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return text.length > 10 && (text.includes("analyze") || text.includes("check") || text.includes("scan") || text.includes("token"));
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    const text = (message.content as any)?.text || "";
    const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    
    if (!addressMatch) {
      await callback({ text: "Please provide a Solana token address to analyze. Example: analyze So11111111111111111111111111111111111111112" });
      return;
    }

    const address = addressMatch[0];
    
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await res.json();
      const pair = data.pairs?.[0];
      
      if (!pair) {
        await callback({ text: `No trading data found for token ${address}. This could mean the token is not listed on any DEX yet, or the address is invalid.` });
        return;
      }

      const liquidity = parseFloat(pair.liquidity?.usd || "0");
      const volume24h = parseFloat(pair.volume?.h24 || "0");
      const priceChange24h = parseFloat(pair.priceChange?.h24 || "0");
      const buys = pair.txns?.h24?.buys || 0;
      const sells = pair.txns?.h24?.sells || 0;
      const pairAge = pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 86400000) : 0;

      let riskLevel = "LOW";
      const warnings: string[] = [];
      
      if (liquidity < 10000) { riskLevel = "HIGH"; warnings.push("Very low liquidity (<$10K)"); }
      else if (liquidity < 50000) { riskLevel = "MEDIUM"; warnings.push("Low liquidity (<$50K)"); }
      
      if (pairAge < 1) { riskLevel = "HIGH"; warnings.push("Very new pair (<1 day old)"); }
      else if (pairAge < 7) { warnings.push("New pair (<1 week old)"); }
      
      if (sells > buys * 2) { warnings.push("High sell pressure (2x more sells than buys)"); }
      if (Math.abs(priceChange24h) > 50) { warnings.push(`Extreme volatility (${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}% in 24h)`); }

      const analysis = `**Token Analysis: ${pair.baseToken?.name} (${pair.baseToken?.symbol})**

**Price:** $${parseFloat(pair.priceUsd || "0").toFixed(8)}
**24h Change:** ${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(2)}%
**Liquidity:** $${liquidity.toLocaleString()}
**24h Volume:** $${volume24h.toLocaleString()}
**Market Cap:** $${pair.marketCap ? parseInt(pair.marketCap).toLocaleString() : "N/A"}
**Buys/Sells (24h):** ${buys}/${sells}
**Pair Age:** ${pairAge} days
**DEX:** ${pair.dexId}

**Risk Level: ${riskLevel}**
${warnings.length > 0 ? "⚠️ Warnings:\n" + warnings.map(w => `- ${w}`).join("\n") : "✅ No major red flags detected"}

*This is data analysis, not financial advice. Always DYOR.*`;

      await callback({ text: analysis });
    } catch (error) {
      await callback({ text: `Error analyzing token: ${(error as Error).message}. Please try again.` });
    }
  }
};

// === WHALE TRACKER ACTION ===
const trackWalletAction: Action = {
  name: "TRACK_WALLET",
  description: "Track recent transactions of a Solana wallet using Helius API",
  similes: ["track wallet", "wallet activity", "whale watch", "monitor wallet"],
  examples: [[
    { user: "user1", content: { text: "Track wallet NaTTUfDDQ8U1RBqb9q5rz6vJ22cWrrT5UAsXuxnb2Wr" } },
    { user: "SolDeFi Agent", content: { text: "Tracking wallet activity..." } }
  ]] as ActionExample[][],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return text.includes("track") || text.includes("wallet") || text.includes("whale");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    const text = (message.content as any)?.text || "";
    const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    
    if (!addressMatch) {
      await callback({ text: "Please provide a Solana wallet address to track." });
      return;
    }

    const address = addressMatch[0];
    const heliusKey = process.env.HELIUS_API_KEY || "d56fdc82-51fb-4718-b521-6af1e99b83ea";

    try {
      const res = await fetch(`https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${heliusKey}&limit=5`);
      const txns = await res.json();

      if (!Array.isArray(txns) || txns.length === 0) {
        await callback({ text: `No recent transactions found for wallet ${address.slice(0, 8)}...${address.slice(-4)}` });
        return;
      }

      let report = `**Wallet Activity: ${address.slice(0, 8)}...${address.slice(-4)}**\n\nLast ${txns.length} transactions:\n`;
      
      for (const tx of txns) {
        const time = tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : "Unknown";
        const type = tx.type || "Unknown";
        const fee = tx.fee ? (tx.fee / 1e9).toFixed(6) : "0";
        report += `\n• **${type}** at ${time} (fee: ${fee} SOL)\n  Sig: ${tx.signature?.slice(0, 20)}...`;
      }

      report += "\n\n*Use the token analysis tool for deeper investigation of any tokens involved.*";
      await callback({ text: report });
    } catch (error) {
      await callback({ text: `Error tracking wallet: ${(error as Error).message}` });
    }
  }
};

// === TRENDING TOKENS ACTION ===
const trendingTokensAction: Action = {
  name: "TRENDING_TOKENS",
  description: "Show currently trending tokens on Solana via DexScreener boosts",
  similes: ["trending", "hot tokens", "what's pumping", "popular tokens", "top movers"],
  examples: [[
    { user: "user1", content: { text: "What tokens are trending on Solana?" } },
    { user: "SolDeFi Agent", content: { text: "Checking trending tokens..." } }
  ]] as ActionExample[][],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return text.includes("trending") || text.includes("hot") || text.includes("pumping") || text.includes("popular") || text.includes("movers");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    try {
      const res = await fetch("https://api.dexscreener.com/token-boosts/latest/v1");
      const boosts = await res.json();
      
      const solanaBoosts = Array.isArray(boosts) 
        ? boosts.filter((b: any) => b.chainId === "solana").slice(0, 5)
        : [];

      if (solanaBoosts.length === 0) {
        await callback({ text: "No boosted Solana tokens found right now. Check back later." });
        return;
      }

      let report = "**Trending Solana Tokens (DexScreener Boosts)**\n\n";
      
      for (const boost of solanaBoosts) {
        report += `• **${boost.description || "Unknown"}** — ${boost.amount} boost\n  ${boost.url || ""}\n`;
      }

      report += "\n⚠️ Boosted tokens are promoted (paid). This does NOT mean they are safe. Always analyze before trading.";
      await callback({ text: report });
    } catch (error) {
      await callback({ text: `Error fetching trending tokens: ${(error as Error).message}` });
    }
  }
};

// === PLUGIN EXPORT ===
const solanaDefiPlugin: Plugin = {
  name: "solana-defi-plugin",
  description: "Solana DeFi tools — token analysis, wallet tracking, trending tokens",
  actions: [analyzeTokenAction, trackWalletAction, trendingTokensAction],
  evaluators: [],
  providers: [],
};

export default solanaDefiPlugin;
