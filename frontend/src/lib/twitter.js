// Twitter / X share utility
const APP_URL = "https://adrena.xyz";

export const shareOnX = (text, url) => {
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url || APP_URL)}`;
  window.open(tweet, "_blank", "width=560,height=420,noopener,noreferrer");
};

// Pre-built share messages
export const tweetMyRank = (rank, username, pnl) =>
  shareOnX(
    `I'm ranked #${rank} on @AdrenaFoundation's trading competition!\n💰 P&L: ${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}\n\nCan you beat me? 👀\n#Adrena #Solana #DeFi #Perps`,
    APP_URL
  );

export const tweetMyStats = (username, pnl, winRate, level) =>
  shareOnX(
    `My @AdrenaFoundation trading stats 📊\n👤 ${username} | Lv.${level}\n💰 P&L: ${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}\n🎯 Win Rate: ${winRate}%\n\nCompete now 👇\n#Adrena #Solana #DeFi`,
    APP_URL
  );

export const tweetQuestComplete = (questTitle, xpReward) =>
  shareOnX(
    `Just completed "${questTitle}" on @AdrenaFoundation!\n⚡ +${xpReward} XP earned\n\nThe trading competition is live — join now 🔥\n#Adrena #Solana #DeFi #Perps`,
    APP_URL
  );

export const tweetSocialPost = (content, playerName) =>
  shareOnX(
    `"${content}"\n— ${playerName} on @AdrenaFoundation Arena\n\n#Adrena #Solana #TradingComp`,
    APP_URL
  );

export const tweetChampion = (teamName, score) =>
  shareOnX(
    `🏆 ${teamName} just won the Adrena Tournament!\n📊 Score: ${score} pts\n\nWill you challenge them next season?\n#Adrena #Solana #DeFi #Perps`,
    APP_URL
  );

export const tweetDuelResult = (winnerName, loserName, prize) =>
  shareOnX(
    `⚔️ ${winnerName} just won a trading duel vs ${loserName} on @AdrenaFoundation!\n🏆 Prize: ${prize} chips\n\nThink you can do better? Challenge anyone 👇\n#Adrena #Solana #TradingDuels`,
    APP_URL
  );
