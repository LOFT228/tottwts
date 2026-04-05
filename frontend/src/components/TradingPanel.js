import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, VersionedTransaction, Transaction } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const TOKENS = [
  { symbol: "SOL", name: "Solana" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "JITOSOL", name: "JitoSOL" },
  { symbol: "ETH", name: "Ethereum" },
];
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_RPC = process.env.REACT_APP_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

export const TradingPanel = () => {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [side, setSide] = useState("long");
  const [token, setToken] = useState("SOL");
  const [collateral, setCollateral] = useState("10");
  const [leverage, setLeverage] = useState("5");
  const [slippage, setSlippage] = useState("0.3");
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState(null);
  const [step, setStep] = useState("idle"); // idle | building | signing | confirming | done

  const resetState = () => { setStep("idle"); setTxSig(null); };

  const handleTrade = async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    setLoading(true);
    setTxSig(null);
    setStep("building");

    try {
      const tradeData = {
        owner: publicKey.toBase58(),
        symbol: token,
        collateral_mint: USDC_MINT,
        collateral_amount: collateral,
        leverage,
        slippage,
      };

      const endpoint = side === "long" ? "openLong" : "openShort";
      const res = await api[endpoint](tradeData);
      const txBase64 = res.data?.data?.transaction;

      if (!txBase64) {
        const errMsg = res.data?.error ? JSON.stringify(res.data.error) : "No transaction returned";
        toast.error("Trade setup failed: " + errMsg);
        setStep("idle");
        return;
      }

      // Deserialize the transaction
      setStep("signing");
      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
      let tx;
      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(Buffer.from(txBase64, "base64"));
      }

      // Sign & send via wallet adapter
      setStep("confirming");
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const signature = await sendTransaction(tx, connection, { skipPreflight: false });

      setTxSig(signature);
      setStep("done");
      toast.success(`Trade executed! Sig: ${signature.slice(0, 8)}...`, {
        description: `${side.toUpperCase()} ${token} @ ${leverage}x`,
        action: { label: "View", onClick: () => window.open(`https://solscan.io/tx/${signature}`, "_blank") },
      });
    } catch (e) {
      const msg = e?.message || "Unknown error";
      if (msg.includes("rejected") || msg.includes("User rejected")) {
        toast.error("Transaction rejected by wallet");
      } else {
        toast.error("Trade failed: " + msg);
      }
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const positionSize = parseFloat(collateral || 0) * parseFloat(leverage || 1);
  const isLong = side === "long";

  const stepLabels = {
    building: "Building Transaction...",
    signing:  "Approve in Wallet...",
    confirming: "Confirming on-chain...",
    done:     "Executed!",
  };

  return (
    <Card
      className="bg-card border-zinc-800 transition-colors duration-150 rounded-lg"
      data-testid="trading-panel"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            {isLong
              ? <TrendingUp size={16} className="text-emerald-400" />
              : <TrendingDown size={16} className="text-red-400" />}
            Trade
          </CardTitle>
          <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[11px]">Adrena Perps</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Long/Short Toggle */}
        <Tabs value={side} onValueChange={(v) => { setSide(v); resetState(); }}>
          <TabsList className="w-full bg-zinc-900 border border-zinc-800 h-10 rounded-md" data-testid="trade-side-tabs">
            <TabsTrigger
              value="long"
              className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-xs font-medium rounded-md"
              data-testid="trade-long-tab"
            >
              <TrendingUp size={13} className="mr-1" /> Long
            </TabsTrigger>
            <TabsTrigger
              value="short"
              className="flex-1 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-xs font-medium rounded-md"
              data-testid="trade-short-tab"
            >
              <TrendingDown size={13} className="mr-1" /> Short
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Token Select */}
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1.5">Token</label>
          <Select value={token} onValueChange={setToken}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white text-xs hover:border-zinc-700 transition-colors rounded-md" data-testid="trade-token-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-lg">
              {TOKENS.map((t) => (
                <SelectItem key={t.symbol} value={t.symbol} data-testid={`token-${t.symbol.toLowerCase()}`}>
                  {t.symbol} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collateral */}
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1.5">Collateral (USDC)</label>
          <Input
            type="number" value={collateral} onChange={(e) => setCollateral(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white text-sm focus:border-indigo-500/50 transition-colors rounded-md"
            placeholder="10" data-testid="trade-collateral-input"
          />
        </div>

        {/* Leverage */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[11px] text-zinc-500">Leverage</label>
            <span className={`text-xs font-semibold font-mono ${isLong ? "text-emerald-400" : "text-red-400"}`}>{leverage}x</span>
          </div>
          <input
            type="range" min="1" max="50" value={leverage} onChange={(e) => setLeverage(e.target.value)}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
            data-testid="trade-leverage-slider"
          />
          <div className="flex justify-between text-[11px] text-zinc-600 mt-1">
            <span>1x</span><span>10x</span><span>25x</span><span>50x</span>
          </div>
        </div>

        {/* Slippage */}
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1.5">Slippage %</label>
          <Input
            type="number" step="0.1" value={slippage} onChange={(e) => setSlippage(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-indigo-500/50 transition-colors rounded-md"
            placeholder="0.3" data-testid="trade-slippage-input"
          />
        </div>

        {/* Position Preview */}
        <div className={`border rounded-md p-3 space-y-1.5 transition-colors duration-150 ${isLong ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-red-500/[0.03] border-red-500/10"}`}>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Position Size</span>
            <span className={`font-semibold font-mono ${isLong ? "text-emerald-400" : "text-red-400"}`}>${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Direction</span>
            <span className={isLong ? "text-emerald-400" : "text-red-400"}>{side.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Token</span>
            <span className="text-white">{token}</span>
          </div>
        </div>

        {/* Progress Steps (when loading) */}
        {loading && step !== "idle" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 animate-blur-in" data-testid="trade-progress">
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-indigo-400" />
              <span className="text-xs text-indigo-400">{stepLabels[step]}</span>
            </div>
            <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: step === "building" ? "33%" : step === "signing" ? "66%" : "90%" }}
              />
            </div>
          </div>
        )}

        {/* Success state */}
        {step === "done" && txSig && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-3 animate-blur-in" data-testid="trade-success">
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">Transaction Confirmed</span>
            </div>
            <a
              href={`https://solscan.io/tx/${txSig}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-indigo-400 mt-1.5 transition-colors"
            >
              <ExternalLink size={9} />
              {txSig.slice(0, 16)}...{txSig.slice(-8)}
            </a>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleTrade}
          disabled={loading}
          className={`w-full font-semibold text-xs h-10 rounded-md transition-colors duration-150 ${
            isLong
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
          data-testid="execute-trade-btn"
        >
          {loading ? (
            <><Loader2 size={14} className="mr-1.5 animate-spin" /> {stepLabels[step] || "Processing..."}</>
          ) : !connected ? (
            <><Wallet size={14} className="mr-1.5" /> Connect Wallet to Trade</>
          ) : (
            `Open ${side.toUpperCase()} ${token} @ ${leverage}x`
          )}
        </Button>

        {connected && (
          <p className="text-[11px] text-zinc-600 text-center">
            Transaction will require wallet signature via Phantom/Backpack
          </p>
        )}
      </CardContent>
    </Card>
  );
};
