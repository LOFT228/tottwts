import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = {
  seed: () => axios.post(`${API}/seed`),
  getStats: () => axios.get(`${API}/stats`),
  getCompetitions: (status) => axios.get(`${API}/competitions`, { params: status ? { status } : {} }),
  getCompetition: (id) => axios.get(`${API}/competitions/${id}`),
  getLeaderboard: (params) => axios.get(`${API}/leaderboard`, { params }),
  getPlayers: () => axios.get(`${API}/players`),
  getPlayer: (id) => axios.get(`${API}/players/${id}`),
  getTeams: () => axios.get(`${API}/teams`),
  getTeam: (id) => axios.get(`${API}/teams/${id}`),
  createTeam: (data) => axios.post(`${API}/teams`, data),
  getQuests: (quest_type) => axios.get(`${API}/quests`, { params: quest_type ? { quest_type } : {} }),
  completeQuest: (id) => axios.post(`${API}/quests/${id}/complete`),
  getAchievements: () => axios.get(`${API}/achievements`),
  getSocialFeed: (params) => axios.get(`${API}/social`, { params }),
  createPost: (data) => axios.post(`${API}/social`, data),
  likePost: (id) => axios.post(`${API}/social/${id}/like`),
  getAIInsights: (data) => axios.post(`${API}/ai/insights`, data),
  // Real Adrena API proxies
  getAdrenaPoolStats: () => axios.get(`${API}/adrena/pool-stats`),
  getAdrenaLiquidity: () => axios.get(`${API}/adrena/liquidity`),
  getAdrenaAPR: () => axios.get(`${API}/adrena/apr`),
  getAdrenaPositions: (wallet, limit = 20) => axios.get(`${API}/adrena/positions/${wallet}`, { params: { limit } }),
  // Trading
  openLong: (data) => axios.post(`${API}/adrena/trade/open-long`, data),
  openShort: (data) => axios.post(`${API}/adrena/trade/open-short`, data),
  closeLong: (data) => axios.post(`${API}/adrena/trade/close-long`, data),
  closeShort: (data) => axios.post(`${API}/adrena/trade/close-short`, data),
  // Wallet
  registerWallet: (data) => axios.post(`${API}/players/register-wallet`, data),
  getLiveLeaderboard: () => axios.get(`${API}/leaderboard/live`),
  // Tournament
  getBracket: () => axios.get(`${API}/tournaments/bracket`),
  // Team chat
  getTeamChat: (teamId) => axios.get(`${API}/teams/${teamId}/chat`),
  postTeamChat: (teamId, data) => axios.post(`${API}/teams/${teamId}/chat`, data),
  // Predictions
  getPredictionsLeaderboard: () => axios.get(`${API}/predictions/leaderboard-with-odds`),
  getPredictions: (competitionId) => axios.get(`${API}/predictions`, { params: { competition_id: competitionId } }),
  getMyPredictions: (wallet) => axios.get(`${API}/predictions/my/${wallet}`),
  getPredictionStats: () => axios.get(`${API}/predictions/stats`),
  placePrediction: (data) => axios.post(`${API}/predictions`, data),
  // Bulk import
  bulkRegisterWallets: (wallets) => axios.post(`${API}/players/bulk-register`, { wallets }),
  // Trading Duels
  getDuels: (status) => axios.get(`${API}/duels`, { params: status ? { status } : {} }),
  getMyDuels: (wallet) => axios.get(`${API}/duels/my/${wallet}`),
  getDuelStats: () => axios.get(`${API}/duels/stats`),
  createDuel: (data) => axios.post(`${API}/duels`, data),
  acceptDuel: (duelId) => axios.post(`${API}/duels/${duelId}/accept`),
  declineDuel: (duelId) => axios.post(`${API}/duels/${duelId}/decline`),
  resolveDuel: (duelId) => axios.post(`${API}/duels/${duelId}/resolve`),
};
