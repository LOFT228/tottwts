import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { WalletButton } from "./WalletButton";

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background" data-testid="app-layout">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-end px-6 py-3 border-b border-zinc-800/80 bg-background/80 backdrop-blur-sm shrink-0" data-testid="app-header">
          <WalletButton />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
