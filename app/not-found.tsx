import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">The page you requested could not be found.</p>
      <Button asChild>
        <Link href="/">Back to projects</Link>
      </Button>
    </div>
  );
}
