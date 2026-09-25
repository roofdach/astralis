import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-50 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🍪
        </span>
        <span className="text-xl font-black uppercase tracking-tighter text-[var(--foreground)]">Astralis</span>
        <span className="hidden text-sm font-medium text-[var(--muted-foreground)] sm:inline">Cookie Clicker</span>
      </div>
      <ThemeToggle />
    </header>
  );
}
