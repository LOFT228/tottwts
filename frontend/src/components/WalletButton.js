import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Copy, Check, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export const WalletButton = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { player, playerLoading } = useWalletContext();
  const [copied, setCopied] = useState(false);

  const shortAddr = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "";

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="bg-indigo-500 text-white font-semibold text-xs h-9 px-4 rounded-md hover:bg-indigo-600 transition-colors"
        data-testid="connect-wallet-btn"
      >
        <span className="flex items-center gap-1.5">
          <Wallet size={14} /> Connect Wallet
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-zinc-700 bg-zinc-800/50 text-zinc-200 text-xs h-9 px-3 rounded-md hover:bg-zinc-800"
          data-testid="wallet-connected-btn"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
          {playerLoading ? "Loading..." : player ? player.username : shortAddr}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-zinc-900 border-zinc-800 min-w-[200px] rounded-lg">
        {player && (
          <>
            <div className="px-3 py-2 border-b border-zinc-800">
              <p className="text-sm text-white font-semibold">{player.username}</p>
              <p className="text-[11px] font-mono text-zinc-500">{shortAddr}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[11px]">Lv.{player.level}</Badge>
                <span className={`text-[11px] font-semibold font-mono ${(player.stats?.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(player.stats?.pnl || 0) >= 0 ? "+" : ""}${(player.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} P&L
                </span>
              </div>
            </div>
            <Link to="/profile">
              <DropdownMenuItem className="text-zinc-300 text-xs cursor-pointer" data-testid="view-profile-btn">
                <User size={12} className="mr-2" /> View Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-zinc-800" />
          </>
        )}
        <DropdownMenuItem onClick={copyAddress} className="text-zinc-300 text-xs cursor-pointer" data-testid="copy-address-btn">
          {copied ? <Check size={12} className="mr-2 text-emerald-400" /> : <Copy size={12} className="mr-2" />}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect} className="text-red-400 text-xs cursor-pointer" data-testid="disconnect-wallet-btn">
          <LogOut size={12} className="mr-2" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
