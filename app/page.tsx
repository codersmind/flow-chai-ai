import Link from "next/link";
import { listProjects } from "@/lib/db/repositories/projects";
import { AppNav } from "@/components/layout/app-nav";
import { NewProjectButton } from "@/components/projects/project-form";
import { ImportProjectButton } from "@/components/projects/import-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Dashboard() {
  const projects = await listProjects();
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your agents</h1>
            <p className="text-sm text-muted-foreground">
              Build conversational agents that run entirely on your machine.
            </p>
          </div>
          <div className="flex gap-2">
            <ImportProjectButton />
            <NewProjectButton />
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-12 text-center">
            <h2 className="mb-2 text-lg font-semibold">No agents yet</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Click &quot;New project&quot; to create your first agent.
            </p>
            <NewProjectButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block">
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {p.description || "No description yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(p.updatedAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
