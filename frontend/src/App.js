import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import { Layout } from "@/components/Layout";
import Arena from "@/pages/Arena";
import Leaderboard from "@/pages/Leaderboard";
import Teams from "@/pages/Teams";
import Quests from "@/pages/Quests";
import Profile from "@/pages/Profile";
import Social from "@/pages/Social";
import Tournament from "@/pages/Tournament";
import Predictions from "@/pages/Predictions";
import Duels from "@/pages/Duels";

function App() {
  return (
    <div className="dark">
      <SolanaWalletProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Arena />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/social" element={<Social />} />
              <Route path="/tournament" element={<Tournament />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/duels" element={<Duels />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </SolanaWalletProvider>
    </div>
  );
}

export default App;
