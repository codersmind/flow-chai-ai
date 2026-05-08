import Link from "next/link";
import { Settings, Workflow, Home } from "lucide-react";

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 m-3 flex h-14 items-center justify-between rounded-2xl border bg-background/80 px-4 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Workflow className="h-4 w-4" />
        </span>
        LocalVoiceFlow
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/" className="flex items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground">
          <Home className="h-4 w-4" /> Projects
        </Link>
        <Link href="/settings" className="flex items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground">
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </nav>
    </header>
  );
}
