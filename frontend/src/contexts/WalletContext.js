import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const WalletContext = createContext(null);

export const WalletContextProvider = ({ children }) => {
  const { publicKey, connected, connecting } = useWallet();
  const [player, setPlayer] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);

  const registerAndFetch = useCallback(async (walletAddress) => {
    setPlayerLoading(true);
    setPositionsLoading(true);
    try {
      // Register or fetch existing player by wallet
      const res = await api.registerWallet({ wallet_address: walletAddress });
      setPlayer(res.data);
    } catch (e) {
      console.error("Failed to register wallet:", e);
      toast.error("Failed to load wallet profile");
    } finally {
      setPlayerLoading(false);
    }

    try {
      // Fetch real positions
      const posRes = await api.getAdrenaPositions(walletAddress, 20);
      setPositions(posRes.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch positions:", e);
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    if (!publicKey) return;
    setPositionsLoading(true);
    try {
      const posRes = await api.getAdrenaPositions(publicKey.toBase58(), 20);
      setPositions(posRes.data?.data || []);
    } catch (e) {
      console.error("Failed to refresh positions:", e);
    } finally {
      setPositionsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      registerAndFetch(publicKey.toBase58());
    } else if (!connected && !connecting) {
      setPlayer(null);
      setPositions([]);
    }
  }, [connected, publicKey, connecting, registerAndFetch]);

  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider
      value={{
        player,
        positions,
        positionsLoading,
        playerLoading,
        walletAddress,
        shortAddress,
        connected,
        refreshPositions,
        setPlayer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used inside WalletContextProvider");
  return ctx;
};
