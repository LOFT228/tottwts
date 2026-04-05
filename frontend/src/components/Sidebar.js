import { NavLink } from "react-router-dom";
import { Swords, Trophy, Users, Target, User, MessageSquare, GitBranch, Crosshair, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { path: "/",            icon: Swords,     label: "Arena"   },
  { path: "/leaderboard", icon: Trophy,     label: "Ranks"   },
  { path: "/predictions", icon: Crosshair,  label: "Predict" },
  { path: "/duels",       icon: Flame,      label: "Duels"   },
  { path: "/tournament",  icon: GitBranch,  label: "Bracket" },
  { path: "/teams",       icon: Users,      label: "Teams"   },
  { path: "/quests",      icon: Target,     label: "Quests"  },
  { path: "/profile",     icon: User,       label: "Profile" },
  { path: "/social",      icon: MessageSquare, label: "Social" },
];

export const Sidebar = () => {
  return (
    <aside className="w-[72px] lg:w-56 border-r border-zinc-800/80 bg-card flex flex-col py-6 px-2 lg:px-4 shrink-0" data-testid="sidebar">
      <div className="mb-8 px-1 lg:px-2">
        <h1 className="hidden lg:block text-lg font-extrabold text-foreground tracking-tight">
          Adrena
        </h1>
        <span className="lg:hidden text-sm font-extrabold text-foreground text-center block">A</span>
        <span className="hidden lg:block text-[11px] text-zinc-500 mt-0.5">
          Trading Competition
        </span>
      </div>
      <Separator className="bg-zinc-800/60 mb-4" />
      <nav className="flex flex-col gap-0.5 flex-1" data-testid="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            data-testid={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            <span className="hidden lg:block text-[13px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-zinc-800/60 mt-4 mb-3" />
      <div className="px-2 hidden lg:block">
        <p className="text-[11px] text-zinc-600">Powered by Solana</p>
      </div>
    </aside>
  );
};
