"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../app/ThemeProvider";
import Link from "next/link";
import { 
  Moon, 
  Sun, 
  House, 
  ShoppingBag, 
  Activity, 
  LayoutDashboard,
  MessageCircle
} from "lucide-react";

const Header = ({ home = false, purchase = false, discord = false }) => {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation Logic
  const handleNav = (e, path) => {
    e.preventDefault();
    if (pathname !== path) {
      router.push(path);
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinkClass = (isActive) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-accent text-accent-foreground border border-border shadow-sm"
        : "text-foreground/60 hover:text-foreground hover:bg-muted"
    }`;

  return (
    <header className="fixed top-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
      

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => handleNav(e, "/")}>
          <Activity size={22} className="text-blue-500 animate-pulse" />
          <span className="text-xl font-black tracking-tighter text-foreground uppercase">
            Astralis
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" onClick={(e) => handleNav(e, "/")} className={navLinkClass(home)}>
            <House size={16} />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <Link href="/purchase" onClick={(e) => handleNav(e, "/purchase")} className={navLinkClass(purchase)}>
            <ShoppingBag size={16} />
            <span className="text-sm font-medium">Purchase</span>
          </Link>
          <Link href="https://discord.gg/astralis" target="_blank" className={navLinkClass(discord)}>
            <MessageCircle size={16} />
            <span className="text-sm font-medium">Discord</span>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md bg-card border border-border text-foreground hover:bg-accent transition-all active:scale-90"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>


        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-all active:scale-95"
        >
          <LayoutDashboard size={16} />
          <span className="hidden xs:inline">Dashboard</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;