import Link from "next/link";
import { Settings, Workflow, Home } from "lucide-react";

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
        <Workflow className="h-4 w-4 text-primary" />
        LocalVoiceFlow
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <Home className="h-4 w-4" /> Projects
        </Link>
        <Link href="/settings" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </nav>
    </header>
  );
}
